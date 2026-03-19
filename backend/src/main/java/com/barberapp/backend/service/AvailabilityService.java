package com.barberapp.backend.service;

import com.barberapp.backend.dto.AvailabilityDTO;
import com.barberapp.backend.model.AppointmentStatus;
import com.barberapp.backend.model.BarberAvailability;
import com.barberapp.backend.model.User;
import com.barberapp.backend.repository.AppointmentRepository;
import com.barberapp.backend.repository.AvailabilityRepository;
import com.barberapp.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AvailabilityService {

    private final AvailabilityRepository availabilityRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;

    // Create/update the schedule
    public AvailabilityDTO save(Long barberId, AvailabilityDTO dto) {
        User barber = userRepository.findById(barberId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Barber not found: " + barberId));

        // If it already exists, update
        BarberAvailability availability = availabilityRepository
                .findByBarberIdAndDayOfWeek(barberId, dto.getDayOfWeek())
                .orElse(BarberAvailability.builder().barber(barber).build());

        availability.setDayOfWeek(dto.getDayOfWeek());
        availability.setStartTime(dto.getStartTime());
        availability.setEndTime(dto.getEndTime());
        availability.setSlotDurationMinutes(dto.getSlotDurationMinutes());

        return convertToDTO(availabilityRepository.save(availability));
    }

    // List the registered schedules
    public List<AvailabilityDTO> getByBarberId(Long barberId) {
        return availabilityRepository.findByBarberId(barberId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Create possible slots in a day
    public List<String> getAvailableSlots(Long barberId, LocalDate date) {
        int dayOfWeek = date.getDayOfWeek().getValue() % 7; // 0=Sunday, 6 = Saturday

        BarberAvailability availability = availabilityRepository
                .findByBarberIdAndDayOfWeek(barberId, dayOfWeek)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Barber does not work on this day"));

        // Generate all slots in a day
        List<String> allSlots = generateSlots(
                availability.getStartTime(),
                availability.getEndTime(),
                availability.getSlotDurationMinutes());

        // Get confirmed ou pending appointments
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(23, 59, 59);

        List<String> occupiedSlots = appointmentRepository
                .findByBarberIdAndDateBetweenOrderByDateAsc(
                        barberId, startOfDay, endOfDay)
                .stream()
                .filter(a -> a.getStatus() == AppointmentStatus.PENDING
                        || a.getStatus() == AppointmentStatus.CONFIRMED)
                .map(a -> a.getDate().toLocalTime()
                        .format(DateTimeFormatter.ofPattern("HH:mm")))
                .collect(Collectors.toList());

        // Remove the occupied slots
        allSlots.removeAll(occupiedSlots);
        return allSlots;
    }

    // Generate the list of schedules between the start and end
    private List<String> generateSlots(String startTime, String endTime,
                                       int slotDuration) {
        List<String> slots = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm");

        LocalTime current = LocalTime.parse(startTime, formatter);
        LocalTime end = LocalTime.parse(endTime, formatter);

        while (current.isBefore(end)) {
            slots.add(current.format(formatter));
            current = current.plusMinutes(slotDuration);
        }

        return slots;
    }

    private AvailabilityDTO convertToDTO(BarberAvailability availability) {
        return AvailabilityDTO.builder()
                .id(availability.getId())
                .barberId(availability.getBarber().getId())
                .dayOfWeek(availability.getDayOfWeek())
                .startTime(availability.getStartTime())
                .endTime(availability.getEndTime())
                .slotDurationMinutes(availability.getSlotDurationMinutes())
                .build();
    }
}