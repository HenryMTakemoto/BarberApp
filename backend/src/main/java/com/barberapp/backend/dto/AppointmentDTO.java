package com.barberapp.backend.dto;

import com.barberapp.backend.model.AppointmentStatus;
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
    private LocalDateTime date;
    private AppointmentStatus status;

    // Para criar um agendamento, precisamos apenas dos IDs
    private Long clientId;
    private Long barberId;
    private Long specialtyId;

    // Campos opcionais para facilitar a leitura no Frontend (Visualização)
    // Opcional: preenchemos isso na hora de devolver a resposta pro app
    private String clientName;
    private String barberName;
    private String specialtyName;
}