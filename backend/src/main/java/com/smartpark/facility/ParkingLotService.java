package com.smartpark.facility;

import com.smartpark.common.ResourceNotFoundException;
import com.smartpark.slot.OperationalStatus;
import com.smartpark.slot.ParkingSlotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ParkingLotService {

    private final ParkingLotRepository parkingLotRepository;
    private final ParkingSlotRepository parkingSlotRepository;

    public List<ParkingLot> getAllFacilities(String query) {
        if (query != null && !query.trim().isEmpty()) {
            return parkingLotRepository.searchFacilities(query.trim());
        }
        return parkingLotRepository.findAll();
    }

    public ParkingLot getFacilityById(UUID id) {
        return parkingLotRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facility not found with ID: " + id));
    }

    @Transactional
    public ParkingLot createFacility(ParkingLot parkingLot) {
        return parkingLotRepository.save(parkingLot);
    }
}
