package com.smartpark.slot;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.smartpark.facility.ParkingLot;
import com.smartpark.facility.Zone;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "parking_slots")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ParkingSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facility_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private ParkingLot facility;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "zone_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "facility"})
    private Zone zone;

    @Column(name = "slot_code", nullable = false, length = 50)
    private String slotCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "vehicle_type", nullable = false, length = 20)
    @Builder.Default
    private VehicleType vehicleType = VehicleType.CAR;

    @Enumerated(EnumType.STRING)
    @Column(name = "operational_status", nullable = false, length = 20)
    @Builder.Default
    private OperationalStatus operationalStatus = OperationalStatus.AVAILABLE;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
