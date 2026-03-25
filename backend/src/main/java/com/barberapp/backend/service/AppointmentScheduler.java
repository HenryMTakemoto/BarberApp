package com.barberapp.backend.service;

import com.barberapp.backend.model.Appointment;
import com.barberapp.backend.model.AppointmentStatus;
import com.barberapp.backend.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class AppointmentScheduler {

    private final AppointmentRepository appointmentRepository;

    // Runs every 5 minutes — checks for appointments that should be completed
    // fixedRate = 300000ms = 5 minutes
    @Scheduled(fixedRate = 300000)
    @Transactional
    public void autoCompleteAppointments() {
        LocalDateTime now = LocalDateTime.now();

        // Find all PENDING or CONFIRMED appointments
        List<Appointment> appointments = appointmentRepository
                .findByStatusIn(List.of(
                        AppointmentStatus.PENDING,
                        AppointmentStatus.CONFIRMED
                ));

        for (Appointment appointment : appointments) {
            // Get service duration in minutes
            int durationMinutes = appointment.getService().getDurationMinutes();

            // Calculate when appointment should end
            LocalDateTime endTime = appointment.getDate()
                    .plusMinutes(durationMinutes);

            // If end time has passed, mark as COMPLETED
            if (endTime.isBefore(now)) {
                appointment.setStatus(AppointmentStatus.COMPLETED);
                appointmentRepository.save(appointment);
                System.out.println(">>> Auto-completed appointment id: "
                        + appointment.getId());
            }
        }
    }
}