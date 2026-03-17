package com.barberapp.backend.repository;

import com.barberapp.backend.model.BarberService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceRepository extends JpaRepository<BarberService, Long> {
    List<BarberService> findByBarberId(Long barberId);
}