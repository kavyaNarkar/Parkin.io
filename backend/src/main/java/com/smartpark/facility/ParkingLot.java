package com.smartpark.facility;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "parking_lots")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ParkingLot {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String address;

    private String city;

    private String state;

    private Double latitude;

    private Double longitude;

    @Column(name = "opening_time", length = 10)
    @Builder.Default
    private String openingTime = "00:00";

    @Column(name = "closing_time", length = 10)
    @Builder.Default
    private String closingTime = "23:59";

    @Column(name = "time_zone", length = 50)
    @Builder.Default
    private String timeZone = "Asia/Kolkata";

    @Column(length = 20)
    @Builder.Default
    private String status = "ACTIVE";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
