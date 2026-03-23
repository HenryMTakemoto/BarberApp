package com.barberapp.backend.dto;

import com.barberapp.backend.model.AppointmentStatus;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentDTO {

    private Long id;

    // Tell Jackson exactly how to parse the date string from frontend
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime date;

    private AppointmentStatus status;

    private Long clientId;
    private Long barberId;
    private Long serviceId;

    // Response fields
    private String clientName;
    private String barberName;
    private String serviceName;
    private Double servicePrice;
    private Integer serviceDuration;
}