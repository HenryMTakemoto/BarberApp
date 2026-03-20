package com.barberapp.backend.repository;

import com.barberapp.backend.model.BlockedSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface BlockedSlotRepository
        extends JpaRepository<BlockedSlot, Long> {

    // Barber can block in a specific date
    List<BlockedSlot> findByBarberIdAndBlockedDate(
            Long barberId, LocalDate date);

    // All future blocks
    List<BlockedSlot> findByBarberIdAndBlockedDateGreaterThanEqual(
            Long barberId, LocalDate date);
}