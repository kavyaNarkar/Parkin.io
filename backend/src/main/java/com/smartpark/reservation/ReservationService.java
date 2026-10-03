package com.smartpark.reservation;

import com.smartpark.common.ResourceNotFoundException;
import com.smartpark.common.SlotUnavailableException;
import com.smartpark.pricing.Rate;
import com.smartpark.pricing.RateRepository;
import com.smartpark.slot.OperationalStatus;
import com.smartpark.slot.ParkingSlot;
import com.smartpark.slot.ParkingSlotRepository;
import com.smartpark.user.User;
import com.smartpark.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final ParkingSlotRepository parkingSlotRepository;
    private final UserRepository userRepository;
    private final RateRepository rateRepository;

    @Value("${smartpark.jwt.hold-duration-minutes:15}")
    private long holdDurationMinutes;

    @Transactional
    public ReservationDto createHold(UUID userId, CreateHoldRequest request) {
        if (request.getStartAt().isAfter(request.getEndAt()) || request.getStartAt().equals(request.getEndAt())) {
            throw new IllegalArgumentException("Start time must be strictly before end time.");
        }

        // Idempotency check
        if (request.getIdempotencyKey() != null && !request.getIdempotencyKey().trim().isEmpty()) {
            Optional<Reservation> existing = reservationRepository.findByIdempotencyKey(request.getIdempotencyKey());
            if (existing.isPresent()) {
                return mapToDto(existing.get());
            }
        }

        // Acquire lock on slot
        ParkingSlot slot = parkingSlotRepository.findByIdWithPessimisticLock(request.getSlotId())
                .orElseThrow(() -> new ResourceNotFoundException("Parking slot not found with ID: " + request.getSlotId()));

        if (slot.getOperationalStatus() != OperationalStatus.AVAILABLE) {
            throw new SlotUnavailableException("Selected slot is currently out of service.");
        }

        Instant now = Instant.now();

        // Check for conflicting reservations
        List<Reservation> conflicts = reservationRepository.findConflictingReservations(
                slot.getId(), request.getStartAt(), request.getEndAt(), now
        );

        if (!conflicts.isEmpty()) {
            throw new SlotUnavailableException("The selected slot is no longer available for this time range.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        // Calculate rate
        BigDecimal totalAmount = calculateTotalAmount(slot, request.getStartAt(), request.getEndAt());

        Instant holdExpiresAt = now.plus(Duration.ofMinutes(holdDurationMinutes));

        Reservation reservation = Reservation.builder()
                .user(user)
                .slot(slot)
                .facility(slot.getFacility())
                .startAt(request.getStartAt())
                .endAt(request.getEndAt())
                .status(ReservationStatus.HELD)
                .holdExpiresAt(holdExpiresAt)
                .totalAmount(totalAmount)
                .idempotencyKey(request.getIdempotencyKey())
                .build();

        Reservation saved = reservationRepository.save(reservation);
        return mapToDto(saved);
    }

    @Transactional
    public ReservationDto confirmReservation(UUID reservationId, UUID userId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found: " + reservationId));

        if (reservation.getStatus() == ReservationStatus.CONFIRMED) {
            return mapToDto(reservation);
        }

        if (reservation.getStatus() != ReservationStatus.HELD) {
            throw new IllegalArgumentException("Cannot confirm reservation in status: " + reservation.getStatus());
        }

        if (reservation.getHoldExpiresAt() != null && reservation.getHoldExpiresAt().isBefore(Instant.now())) {
            reservation.setStatus(ReservationStatus.EXPIRED);
            reservationRepository.save(reservation);
            throw new SlotUnavailableException("Temporary hold on slot has expired. Please re-select a slot.");
        }

        reservation.setStatus(ReservationStatus.CONFIRMED);
        reservation.setHoldExpiresAt(null);
        Reservation confirmed = reservationRepository.save(reservation);

        return mapToDto(confirmed);
    }

    @Transactional
    public ReservationDto cancelReservation(UUID reservationId, UUID userId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found: " + reservationId));

        if (reservation.getStatus() == ReservationStatus.CANCELLED) {
            return mapToDto(reservation);
        }

        if (reservation.getStatus() == ReservationStatus.COMPLETED || reservation.getStatus() == ReservationStatus.CHECKED_IN) {
            throw new IllegalArgumentException("Cannot cancel an active check-in or completed parking session.");
        }

        reservation.setStatus(ReservationStatus.CANCELLED);
        Reservation cancelled = reservationRepository.save(reservation);

        return mapToDto(cancelled);
    }

    public List<ReservationDto> getUserReservations(UUID userId) {
        return reservationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public ReservationDto getReservationById(UUID id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found: " + id));
        return mapToDto(reservation);
    }

    private BigDecimal calculateTotalAmount(ParkingSlot slot, Instant startAt, Instant endAt) {
        long hours = Math.max(1, Duration.between(startAt, endAt).toHours());
        Optional<Rate> rateOpt = rateRepository.findFirstByFacilityIdAndVehicleType(slot.getFacility().getId(), slot.getVehicleType());

        BigDecimal hourlyRate = rateOpt.map(Rate::getAmount).orElse(BigDecimal.valueOf(50.00)); // Default fallback rate
        return hourlyRate.multiply(BigDecimal.valueOf(hours));
    }

    private ReservationDto mapToDto(Reservation r) {
        return ReservationDto.builder()
                .reservationId(r.getId())
                .userId(r.getUser().getId())
                .userName(r.getUser().getName())
                .slotId(r.getSlot().getId())
                .slotCode(r.getSlot().getSlotCode())
                .facilityId(r.getFacility().getId())
                .facilityName(r.getFacility().getName())
                .startAt(r.getStartAt())
                .endAt(r.getEndAt())
                .status(r.getStatus())
                .holdExpiresAt(r.getHoldExpiresAt())
                .totalAmount(r.getTotalAmount())
                .currency("INR")
                .createdAt(r.getCreatedAt())
                .build();
    }
}
