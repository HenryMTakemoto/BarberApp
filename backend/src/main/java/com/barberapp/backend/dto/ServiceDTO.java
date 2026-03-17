package com.barberapp.backend.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceDTO {
    private Long id;
    private String name;
    private Integer durationMinutes;
    private Double price;
    private Long barberId;
    private String barberName;
}