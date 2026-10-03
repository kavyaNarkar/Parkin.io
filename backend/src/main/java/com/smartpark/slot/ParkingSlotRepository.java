package com.smartpark.slot;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ParkingSlotRepository extends JpaRepository<ParkingSlot, UUID> {
    List<ParkingSlot> findByFacilityId(UUID facilityId);
    List<ParkingSlot> findByFacilityIdAndOperationalStatus(UUID facilityId, OperationalStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM ParkingSlot s WHERE s.id = :id")
    Optional<ParkingSlot> findByIdWithPessimisticLock(@Param("id") UUID id);

    long countByFacilityId(UUID facilityId);
    long countByFacilityIdAndOperationalStatus(UUID facilityId, OperationalStatus status);
}
