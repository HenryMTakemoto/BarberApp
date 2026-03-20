package com.barberapp.backend.controller;

import com.barberapp.backend.dto.ServiceDTO;
import com.barberapp.backend.service.BarberServiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/barbers/{barberId}/services")
@RequiredArgsConstructor
public class ServiceController {

    private final BarberServiceService barberServiceService;

    // GET — list barber services (public)
    @GetMapping
    public ResponseEntity<List<ServiceDTO>> getByBarber(
            @PathVariable Long barberId) {
        return ResponseEntity.ok(barberServiceService.getByBarberId(barberId));
    }

    // POST — create service, that requires token
    @PostMapping
    public ResponseEntity<ServiceDTO> create(
            @PathVariable Long barberId,
            @RequestBody ServiceDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(barberServiceService.create(barberId, dto));
    }

    // PUT — update service, requires token too
    @PutMapping("/{serviceId}")
    public ResponseEntity<ServiceDTO> update(
            @PathVariable Long barberId,
            @PathVariable Long serviceId,
            @RequestBody ServiceDTO dto) {
        return ResponseEntity.ok(barberServiceService.update(serviceId, dto));
    }

    // DELETE — remove service, requires token
    @DeleteMapping("/{serviceId}")
    public ResponseEntity<Void> delete(
            @PathVariable Long barberId,
            @PathVariable Long serviceId) {
        barberServiceService.delete(serviceId);
        return ResponseEntity.noContent().build();
    }
}