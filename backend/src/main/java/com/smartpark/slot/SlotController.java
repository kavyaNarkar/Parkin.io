package com.smartpark.slot;

import com.smartpark.common.ApiResponse;
import com.smartpark.common.ResourceNotFoundException;
import com.smartpark.facility.ParkingLot;
import com.smartpark.facility.ParkingLotRepository;
import com.smartpark.facility.Zone;
import com.smartpark.facility.ZoneRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/slots")
@RequiredArgsConstructor
public class SlotController {

    private final ParkingSlotRepository parkingSlotRepository;
    private final ParkingLotRepository parkingLotRepository;
    private final ZoneRepository zoneRepository;

    @GetMapping("/facility/{facilityId}")
    public ResponseEntity<ApiResponse<List<ParkingSlot>>> getSlotsByFacility(@PathVariable UUID facilityId) {
        List<ParkingSlot> slots = parkingSlotRepository.findByFacilityId(facilityId);
        return ResponseEntity.ok(ApiResponse.success(slots));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ParkingSlot>> createSlot(
            @RequestBody ParkingSlot slot,
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
        slot.setFacility(facility);

        if (slot.getZone() != null && slot.getZone().getId() != null) {
            Zone zone = zoneRepository.findById(slot.getZone().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Zone not found"));
            slot.setZone(zone);
        } else {
            slot.setZone(null);
        }

        ParkingSlot saved = parkingSlotRepository.save(slot);
        return ResponseEntity.ok(ApiResponse.success(saved, "Slot created successfully"));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<ParkingSlot>> updateSlotStatus(
            @PathVariable UUID id,
            @RequestParam OperationalStatus status) {
        ParkingSlot slot = parkingSlotRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Slot not found"));
        slot.setOperationalStatus(status);
        ParkingSlot updated = parkingSlotRepository.save(slot);
        return ResponseEntity.ok(ApiResponse.success(updated, "Operational status updated"));
    }
}
