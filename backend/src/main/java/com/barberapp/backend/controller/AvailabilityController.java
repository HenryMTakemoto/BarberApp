package com.barberapp.backend.controller;

import com.barberapp.backend.dto.AvailabilityDTO;
import com.barberapp.backend.dto.BlockedSlotDTO;
import com.barberapp.backend.service.AvailabilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/barbers/{barberId}/availability")
@RequiredArgsConstructor
public class AvailabilityController {

    private final AvailabilityService availabilityService;

    // Work periods

    @GetMapping("/periods")
    public ResponseEntity<List<AvailabilityDTO>> getPeriods(
            @PathVariable Long barberId) {
        return ResponseEntity.ok(availabilityService.getPeriods(barberId));
    }

    @PostMapping("/periods")
    public ResponseEntity<AvailabilityDTO> addPeriod(
            @PathVariable Long barberId,
            @RequestBody AvailabilityDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(availabilityService.savePeriod(barberId, dto));
    }

    @DeleteMapping("/periods/{periodId}")
    public ResponseEntity<Void> deletePeriod(
            @PathVariable Long barberId,
            @PathVariable Long periodId) {
        availabilityService.deletePeriod(periodId);
        return ResponseEntity.noContent().build();
    }

    // Specific blocks

    @GetMapping("/blocked")
    public ResponseEntity<List<BlockedSlotDTO>> getBlocked(
            @PathVariable Long barberId) {
        return ResponseEntity.ok(availabilityService.getBlockedSlots(barberId));
    }

    @PostMapping("/blocked")
    public ResponseEntity<BlockedSlotDTO> addBlocked(
            @PathVariable Long barberId,
            @RequestBody BlockedSlotDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(availabilityService.saveBlockedSlot(barberId, dto));
    }

    @DeleteMapping("/blocked/{blockedId}")
    public ResponseEntity<Void> deleteBlocked(
            @PathVariable Long barberId,
            @PathVariable Long blockedId) {
        availabilityService.deleteBlockedSlot(blockedId);
        return ResponseEntity.noContent().build();
    }

    // Available slots in a day

    @GetMapping("/slots")
    public ResponseEntity<List<String>> getSlots(
            @PathVariable Long barberId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date) {
        return ResponseEntity.ok(
                availabilityService.getAvailableSlots(barberId, date));
    }
}