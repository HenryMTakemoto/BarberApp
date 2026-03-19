package com.barberapp.backend.repository;

import com.barberapp.backend.model.BarberAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AvailabilityRepository extends JpaRepository<BarberAvailability, Long> {

    List<BarberAvailability> findByBarberId(Long barberId);

    List<BarberAvailability> findByBarberIdAndDayOfWeek(
            Long barberId, Integer dayOfWeek);
}