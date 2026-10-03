package com.smartpark.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OccupancyReportDto {

    private long totalFacilities;
    private long totalSlots;
    private long availableSlots;
    private long outOfServiceSlots;
    private long totalReservations;
    private double occupancyRatePercentage;
}
