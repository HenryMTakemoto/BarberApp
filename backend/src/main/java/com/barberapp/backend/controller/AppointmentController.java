package com.barberapp.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.barberapp.backend.dto.AppointmentDTO;
import com.barberapp.backend.service.AppointmentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/appointments") // O endereço base: http://localhost:8080/api/appointments
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    // Criar um novo agendamento (POST)
    @PostMapping
    public ResponseEntity<AppointmentDTO> create(@RequestBody AppointmentDTO dto) {
        AppointmentDTO newAppointment = appointmentService.createAppointment(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(newAppointment);
    }

    // Listar todos os agendamentos (GET)
    @GetMapping
    public ResponseEntity<List<AppointmentDTO>> listAll() {
        return ResponseEntity.ok(appointmentService.listAllAppointments());
    }
}