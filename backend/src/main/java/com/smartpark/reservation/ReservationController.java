package com.smartpark.reservation;

import com.smartpark.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;

    private UUID parseUuid(String str, String paramName) {
        if (str == null || str.trim().isEmpty()) {
            throw new IllegalArgumentException(paramName + " parameter is required");
        }
        try {
            return UUID.fromString(str.trim());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid " + paramName + " format: " + str);
        }
    }

    @PostMapping("/holds")
    public ResponseEntity<ApiResponse<ReservationDto>> createHold(
            @RequestParam(required = false) String userId,
            @Valid @RequestBody CreateHoldRequest request) {
        UUID uUuid = parseUuid(userId, "userId");
        ReservationDto hold = reservationService.createHold(uUuid, request);
        return ResponseEntity.ok(ApiResponse.success(hold, "Slot hold created successfully"));
    }

    @PostMapping("/{id}/confirm")
    public ResponseEntity<ApiResponse<ReservationDto>> confirmReservation(
            @PathVariable UUID id,
            @RequestParam(required = false) String userId) {
        UUID uUuid = parseUuid(userId, "userId");
        ReservationDto confirmed = reservationService.confirmReservation(id, uUuid);
        return ResponseEntity.ok(ApiResponse.success(confirmed, "Reservation confirmed"));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<ReservationDto>> cancelReservation(
            @PathVariable UUID id,
            @RequestParam(required = false) String userId) {
        UUID uUuid = parseUuid(userId, "userId");
        ReservationDto cancelled = reservationService.cancelReservation(id, uUuid);
        return ResponseEntity.ok(ApiResponse.success(cancelled, "Reservation cancelled"));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<ReservationDto>>> getUserReservations(@PathVariable UUID userId) {
        List<ReservationDto> reservations = reservationService.getUserReservations(userId);
        return ResponseEntity.ok(ApiResponse.success(reservations));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ReservationDto>> getReservationById(@PathVariable UUID id) {
        ReservationDto reservation = reservationService.getReservationById(id);
        return ResponseEntity.ok(ApiResponse.success(reservation));
    }
}
