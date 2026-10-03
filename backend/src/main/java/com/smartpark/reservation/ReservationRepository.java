package com.smartpark.reservation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, UUID> {

    List<Reservation> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<Reservation> findByFacilityId(UUID facilityId);

    Optional<Reservation> findByIdempotencyKey(String idempotencyKey);

    @Query("SELECT r FROM Reservation r WHERE r.slot.id = :slotId " +
           "AND r.status IN ('CONFIRMED', 'CHECKED_IN', 'HELD') " +
           "AND (r.status != 'HELD' OR r.holdExpiresAt > :now) " +
           "AND (r.startAt < :endAt AND r.endAt > :startAt)")
    List<Reservation> findConflictingReservations(
            @Param("slotId") UUID slotId,
            @Param("startAt") Instant startAt,
            @Param("endAt") Instant endAt,
            @Param("now") Instant now
    );

    @Query("SELECT r FROM Reservation r WHERE r.status = 'HELD' AND r.holdExpiresAt <= :now")
    List<Reservation> findExpiredHolds(@Param("now") Instant now);
}
