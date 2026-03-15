package com.barberapp.backend.controller;

import com.barberapp.backend.dto.AppointmentDTO;
import com.barberapp.backend.model.AppointmentStatus;
import com.barberapp.backend.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

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

    // GET - agendamentos do cliente
    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<AppointmentDTO>> getByClient(
            @PathVariable Long clientId) {
        return ResponseEntity.ok(appointmentService.getByClientId(clientId));
    }

    // GET — agenda do barbeiro
    @GetMapping("/barber/{barberId}")
    public ResponseEntity<List<AppointmentDTO>> getByBarber(
            @PathVariable Long barberId) {
        return ResponseEntity.ok(appointmentService.getByBarberId(barberId));
    }

    // GET — agenda do barbeiro por data
    @GetMapping("/barber/{barberId}/date/{date}")
    public ResponseEntity<List<AppointmentDTO>> getByBarberAndDate(
            @PathVariable Long barberId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(
                appointmentService.getByBarberIdAndDate(barberId, date));
    }

    // PATCH — atualizar status
    @PatchMapping("/{id}/status")
    public ResponseEntity<AppointmentDTO> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        AppointmentStatus status = AppointmentStatus.valueOf(body.get("status"));
        return ResponseEntity.ok(appointmentService.updateStatus(id, status));
    }

}