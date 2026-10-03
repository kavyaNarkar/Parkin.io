package com.smartpark.facility;

import com.smartpark.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/facilities")
@RequiredArgsConstructor
public class ParkingLotController {

    private final ParkingLotService parkingLotService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ParkingLot>>> getAllFacilities(
            @RequestParam(required = false) String query) {
        List<ParkingLot> facilities = parkingLotService.getAllFacilities(query);
        return ResponseEntity.ok(ApiResponse.success(facilities));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ParkingLot>> getFacilityById(@PathVariable UUID id) {
        ParkingLot facility = parkingLotService.getFacilityById(id);
        return ResponseEntity.ok(ApiResponse.success(facility));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ParkingLot>> createFacility(@RequestBody ParkingLot parkingLot) {
        ParkingLot created = parkingLotService.createFacility(parkingLot);
        return ResponseEntity.ok(ApiResponse.success(created, "Facility created successfully"));
    }
}
