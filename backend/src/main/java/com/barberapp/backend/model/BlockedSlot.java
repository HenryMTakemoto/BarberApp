package com.barberapp.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "blocked_slots")
public class BlockedSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "barber_id", nullable = false)
    private User barber;

    @Column(nullable = false)
    private LocalDate blockedDate;

    @Column(nullable = false)
    private String startTime; // "12:00"

    @Column(nullable = false)
    private String endTime;   // "13:00"

    private String reason;    // "Lunch", "Meeting", etc
}