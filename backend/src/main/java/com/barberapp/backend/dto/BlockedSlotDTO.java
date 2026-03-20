package com.barberapp.backend.dto;

import lombok.*;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlockedSlotDTO {
    private Long id;
    private Long barberId;
    private LocalDate blockedDate;
    private String startTime;
    private String endTime;
    private String reason;
}