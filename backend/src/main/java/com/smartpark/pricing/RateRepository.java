package com.smartpark.pricing;

import com.smartpark.slot.VehicleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RateRepository extends JpaRepository<Rate, UUID> {
    List<Rate> findByFacilityId(UUID facilityId);
    Optional<Rate> findFirstByFacilityIdAndVehicleType(UUID facilityId, VehicleType vehicleType);
}
