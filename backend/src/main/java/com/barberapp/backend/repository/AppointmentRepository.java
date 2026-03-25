package com.barberapp.backend.repository;

import com.barberapp.backend.model.Appointment;
import com.barberapp.backend.model.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    // Agendamentos do cliente
    List<Appointment> findByClientIdOrderByDateDesc(Long clientId);

    // Agendamentos do barbeiro
    List<Appointment> findByBarberIdOrderByDateAsc(Long barberId);

    // Agendamentos do barbeiro por data
    List<Appointment> findByBarberIdAndDateBetweenOrderByDateAsc(
            Long barberId,
            LocalDateTime start,
            LocalDateTime end);

    // Agendamentos por status
    List<Appointment> findByClientIdAndStatusOrderByDateDesc(
            Long clientId,
            AppointmentStatus status);
    List<Appointment> findByStatusIn(List<AppointmentStatus> statuses);

    // Agendamentos por status e range de data (usado para jobs)
    List<Appointment> findByStatusAndDateBetween(
            AppointmentStatus status, 
            LocalDateTime start, 
            LocalDateTime end
    );
}