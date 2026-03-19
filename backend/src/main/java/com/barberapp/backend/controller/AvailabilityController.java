package com.barberapp.backend.controller;

import com.barberapp.backend.dto.AvailabilityDTO;
import com.barberapp.backend.service.AvailabilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/barbers/{barberId}/availability")
@RequiredArgsConstructor
public class AvailabilityController {

    private final AvailabilityService availabilityService;

    // GET — registered schedules (public)
    @GetMapping
    public ResponseEntity<List<AvailabilityDTO>> getByBarber(
            @PathVariable Long barberId) {
        return ResponseEntity.ok(availabilityService.getByBarberId(barberId));
    }

    // GET — available slots in a day (public)
    @GetMapping("/slots")
    public ResponseEntity<List<String>> getSlots(
            @PathVariable Long barberId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date) {
        return ResponseEntity.ok(
                availabilityService.getAvailableSlots(barberId, date));
    }

    // POST — register a work schedule (requires token)
    @PostMapping
    public ResponseEntity<AvailabilityDTO> save(
            @PathVariable Long barberId,
            @RequestBody AvailabilityDTO dto) {
        return ResponseEntity.ok(availabilityService.save(barberId, dto));
    }
}