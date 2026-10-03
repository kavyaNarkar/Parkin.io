package com.smartpark.facility;

import com.smartpark.common.ApiResponse;
import com.smartpark.common.ResourceNotFoundException;
import com.smartpark.pricing.Rate;
import com.smartpark.pricing.RateRepository;
import com.smartpark.reservation.Reservation;
import com.smartpark.reservation.ReservationRepository;
import com.smartpark.reservation.ReservationStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/operator")
@RequiredArgsConstructor
public class OperatorController {

    private final ZoneRepository zoneRepository;
    private final ParkingLotRepository parkingLotRepository;
    private final RateRepository rateRepository;
    private final ReservationRepository reservationRepository;

    @GetMapping("/zones/facility/{facilityId}")
    public ResponseEntity<ApiResponse<List<Zone>>> getZonesByFacility(@PathVariable UUID facilityId) {
        List<Zone> zones = zoneRepository.findByFacilityId(facilityId);
        return ResponseEntity.ok(ApiResponse.success(zones));
    }

    @PostMapping("/zones")
    public ResponseEntity<ApiResponse<Zone>> createZone(
            @RequestBody Zone zone,
            @RequestParam(required = false) String facilityId) {

        if (facilityId == null || facilityId.trim().isEmpty()) {
            throw new IllegalArgumentException("Facility ID parameter is required");
        }

        UUID facUuid;
        try {
            facUuid = UUID.fromString(facilityId.trim());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid Facility ID format: " + facilityId);
        }

        ParkingLot facility = parkingLotRepository.findById(facUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Facility not found"));
        zone.setFacility(facility);
        Zone saved = zoneRepository.save(zone);
        return ResponseEntity.ok(ApiResponse.success(saved, "Zone created successfully"));
    }

    @GetMapping("/rates/facility/{facilityId}")
    public ResponseEntity<ApiResponse<List<Rate>>> getRatesByFacility(@PathVariable UUID facilityId) {
        List<Rate> rates = rateRepository.findByFacilityId(facilityId);
        return ResponseEntity.ok(ApiResponse.success(rates));
    }

    @PostMapping("/rates")
    public ResponseEntity<ApiResponse<Rate>> saveRate(
            @RequestBody Rate rate,
            @RequestParam(required = false) String facilityId) {

        if (facilityId == null || facilityId.trim().isEmpty()) {
            throw new IllegalArgumentException("Facility ID parameter is required");
        }

        UUID facUuid;
        try {
            facUuid = UUID.fromString(facilityId.trim());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid Facility ID format: " + facilityId);
        }

        ParkingLot facility = parkingLotRepository.findById(facUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Facility not found"));
        rate.setFacility(facility);
        Rate saved = rateRepository.save(rate);
        return ResponseEntity.ok(ApiResponse.success(saved, "Pricing rate saved successfully"));
    }

    @PatchMapping("/reservations/{id}/check-in")
    public ResponseEntity<ApiResponse<Reservation>> checkInDriver(@PathVariable UUID id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found"));
        reservation.setStatus(ReservationStatus.CHECKED_IN);
        Reservation updated = reservationRepository.save(reservation);
        return ResponseEntity.ok(ApiResponse.success(updated, "Driver checked-in successfully"));
    }

    @PatchMapping("/reservations/{id}/complete")
    public ResponseEntity<ApiResponse<Reservation>> completeParkingSession(@PathVariable UUID id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found"));
        reservation.setStatus(ReservationStatus.COMPLETED);
        Reservation updated = reservationRepository.save(reservation);
        return ResponseEntity.ok(ApiResponse.success(updated, "Parking session marked completed"));
    }

    @GetMapping("/reservations/facility/{facilityId}")
    public ResponseEntity<ApiResponse<List<Reservation>>> getFacilityReservations(@PathVariable UUID facilityId) {
        List<Reservation> reservations = reservationRepository.findByFacilityId(facilityId);
        return ResponseEntity.ok(ApiResponse.success(reservations));
    }
}
