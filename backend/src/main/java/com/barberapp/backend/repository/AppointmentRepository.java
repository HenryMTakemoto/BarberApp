package com.barberapp.backend.repository;

import com.barberapp.backend.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    
    // Aqui podemos criar buscas personalizadas no futuro, exemplo:
    // List<Appointment> findByBarberId(Long barberId);
}