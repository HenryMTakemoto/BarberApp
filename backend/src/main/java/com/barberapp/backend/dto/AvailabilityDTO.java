package com.barberapp.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvailabilityDTO {
    private Long id;
    private Long barberId;
    private Integer dayOfWeek;
    private String startTime;
    private String endTime;
    private Integer slotDurationMinutes;
}