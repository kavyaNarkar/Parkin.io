package com.smartpark.facility;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ParkingLotRepository extends JpaRepository<ParkingLot, UUID> {
    List<ParkingLot> findByStatus(String status);

    @Query("SELECT p FROM ParkingLot p WHERE p.status = 'ACTIVE' AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.address) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.city) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<ParkingLot> searchFacilities(@Param("query") String query);
}
