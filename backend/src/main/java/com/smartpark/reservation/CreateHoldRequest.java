package com.smartpark.reservation;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
public class CreateHoldRequest {

    @NotNull(message = "Slot ID is required")
    private UUID slotId;

    @NotNull(message = "Start time is required")
    private Instant startAt;

    @NotNull(message = "End time is required")
    private Instant endAt;

    private String idempotencyKey;
}
