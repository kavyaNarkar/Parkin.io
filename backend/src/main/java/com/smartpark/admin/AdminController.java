package com.smartpark.admin;

import com.smartpark.audit.AuditLog;
import com.smartpark.audit.AuditLogRepository;
import com.smartpark.common.ApiResponse;
import com.smartpark.common.ResourceNotFoundException;
import com.smartpark.facility.ParkingLot;
import com.smartpark.facility.ParkingLotRepository;
import com.smartpark.reservation.ReservationRepository;
import com.smartpark.slot.OperationalStatus;
import com.smartpark.slot.ParkingSlotRepository;
import com.smartpark.user.User;
import com.smartpark.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final ParkingLotRepository parkingLotRepository;
    private final ParkingSlotRepository parkingSlotRepository;
    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;

    @GetMapping("/reports/occupancy")
    public ResponseEntity<ApiResponse<OccupancyReportDto>> getOccupancyReport() {
        long totalFacilities = parkingLotRepository.count();
        long totalSlots = parkingSlotRepository.count();
        long availableSlots = parkingSlotRepository.findAll().stream()
                .filter(s -> s.getOperationalStatus() == OperationalStatus.AVAILABLE)
                .count();
        long outOfServiceSlots = totalSlots - availableSlots;
        long totalReservations = reservationRepository.count();

        double occupancyRate = totalSlots > 0 ? ((double) (totalSlots - availableSlots) / totalSlots) * 100 : 0.0;

        OccupancyReportDto report = OccupancyReportDto.builder()
                .totalFacilities(totalFacilities)
                .totalSlots(totalSlots)
                .availableSlots(availableSlots)
                .outOfServiceSlots(outOfServiceSlots)
                .totalReservations(totalReservations)
                .occupancyRatePercentage(Math.round(occupancyRate * 100.0) / 100.0)
                .build();

        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<List<AuditLog>>> getAuditLogs() {
        List<AuditLog> logs = auditLogRepository.findTop50ByOrderByOccurredAtDesc();
        return ResponseEntity.ok(ApiResponse.success(logs));
    }

    @PatchMapping("/facilities/{id}/status")
    public ResponseEntity<ApiResponse<ParkingLot>> updateFacilityStatus(
            @PathVariable UUID id,
            @RequestParam String status) {
        ParkingLot facility = parkingLotRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facility not found"));
        facility.setStatus(status.toUpperCase());
        ParkingLot updated = parkingLotRepository.save(facility);
        return ResponseEntity.ok(ApiResponse.success(updated, "Facility status updated to " + status));
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<ApiResponse<User>> updateUserStatus(
            @PathVariable UUID id,
            @RequestParam String status) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setStatus(status.toUpperCase());
        User updated = userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success(updated, "User status updated to " + status));
    }
}
