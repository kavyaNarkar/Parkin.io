package com.smartpark.reservation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ReservationDto {

    private UUID reservationId;
    private UUID userId;
    private String userName;
    private UUID slotId;
    private String slotCode;
    private UUID facilityId;
    private String facilityName;
    private Instant startAt;
    private Instant endAt;
    private ReservationStatus status;
    private Instant holdExpiresAt;
    private BigDecimal totalAmount;
    private String currency;
    private Instant createdAt;
}
