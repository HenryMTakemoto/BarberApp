package com.barberapp.backend.service;

import com.barberapp.backend.dto.AppointmentDTO;
import com.barberapp.backend.model.Appointment;
import com.barberapp.backend.model.AppointmentStatus;
import com.barberapp.backend.model.BarberService;
import com.barberapp.backend.model.User;
import com.barberapp.backend.repository.AppointmentRepository;
import com.barberapp.backend.repository.ServiceRepository;
import com.barberapp.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final ServiceRepository barberServiceRepository;

    public AppointmentDTO createAppointment(AppointmentDTO dto) {
        // 1. Validate client exists
        User client = userRepository.findById(dto.getClientId())
                .orElseThrow(() -> new RuntimeException("Client not found: " + dto.getClientId()));

        // 2. Validate barber exists
        User barber = userRepository.findById(dto.getBarberId())
                .orElseThrow(() -> new RuntimeException("Barber not found: " + dto.getBarberId()));

        // 3. Validate service exists — uses serviceId instead of specialtyId
        BarberService service = barberServiceRepository.findById(dto.getServiceId())
                .orElseThrow(() -> new RuntimeException("Service not found: " + dto.getServiceId()));

        // 4. Build appointment entity
        Appointment appointment = Appointment.builder()
                .date(dto.getDate())
                .status(AppointmentStatus.PENDING)
                .client(client)
                .barber(barber)
                .service(service)
                .build();

        // 5. Save to database
        Appointment saved = appointmentRepository.save(appointment);

        // 6. Return DTO
        return convertToDTO(saved);
    }

    public List<AppointmentDTO> listAllAppointments() {
        return appointmentRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<AppointmentDTO> getByClientId(Long clientId) {
        return appointmentRepository
                .findByClientIdOrderByDateDesc(clientId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<AppointmentDTO> getByBarberId(Long barberId) {
        return appointmentRepository
                .findByBarberIdOrderByDateAsc(barberId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<AppointmentDTO> getByBarberIdAndDate(Long barberId, LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.atTime(23, 59, 59);
        return appointmentRepository
                .findByBarberIdAndDateBetweenOrderByDateAsc(barberId, start, end)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public AppointmentDTO updateStatus(Long id, AppointmentStatus newStatus) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Appointment not found: " + id));

        appointment.setStatus(newStatus);
        return convertToDTO(appointmentRepository.save(appointment));
    }

    private AppointmentDTO convertToDTO(Appointment appointment) {
        return AppointmentDTO.builder()
                .id(appointment.getId())
                .date(appointment.getDate())
                .status(appointment.getStatus())
                .clientId(appointment.getClient().getId())
                .clientName(appointment.getClient().getName())
                .barberId(appointment.getBarber().getId())
                .barberName(appointment.getBarber().getName())
                .serviceId(appointment.getService().getId())
                .serviceName(appointment.getService().getName())
                .servicePrice(appointment.getService().getPrice())
                .serviceDuration(appointment.getService().getDurationMinutes())
                .build();
    }
}