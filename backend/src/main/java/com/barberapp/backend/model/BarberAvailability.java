package com.barberapp.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "barber_availability")
public class BarberAvailability {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "barber_id", nullable = false)
    private User barber;

    // 0 = Sunday, 1 = Monday, ...
    @Column(nullable = false)
    private Integer dayOfWeek;

    @Column(nullable = false)
    private String startTime; // "08:00"

    @Column(nullable = false)
    private String endTime; // "18:00"

    @Column(nullable = false)
    private Integer slotDurationMinutes; // 30, 45, 60
}