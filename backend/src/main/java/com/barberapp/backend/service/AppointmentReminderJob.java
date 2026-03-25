package com.barberapp.backend.service;

import com.barberapp.backend.model.Appointment;
import com.barberapp.backend.model.AppointmentStatus;
import com.barberapp.backend.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class AppointmentReminderJob {

    private final AppointmentRepository appointmentRepository;
    private final ExpoNotificationService expoNotificationService;

    // Roda a cada 1 minuto (60000 ms)
    @Scheduled(fixedRate = 60000)
    public void sendAppointmentReminders() {
        LocalDateTime now = LocalDateTime.now();
        // Buscar agendamentos que acontecem entre 59 e 60 minutos contados a partir de agora
        LocalDateTime targetStart = now.plusMinutes(59);
        LocalDateTime targetEnd = now.plusMinutes(60);

        List<Appointment> upcomingAppointments = appointmentRepository.findByStatusAndDateBetween(
                AppointmentStatus.CONFIRMED,
                targetStart,
                targetEnd
        );

        for (Appointment appt : upcomingAppointments) {
            String token = appt.getClient().getPushToken();
            if (token != null && !token.isEmpty()) {
                String title = "Lembrete: Seu horário está chegando! \u2702\ufe0f"; // Scissors Emoji
                String body = "Sua visita com " + appt.getBarber().getName() + 
                              " começa às " + String.format("%02d:%02d", appt.getDate().getHour(), appt.getDate().getMinute()) + ".";
                
                expoNotificationService.sendPushNotification(token, title, body);
            }
        }
    }
}
