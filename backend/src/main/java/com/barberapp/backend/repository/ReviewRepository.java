package com.barberapp.backend.repository;

import com.barberapp.backend.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByBarberIdOrderByCreatedAtDesc(Long barberId);

    boolean existsByAppointmentId(Long appointmentId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.barber.id = :barberId")
    Optional<Double> findAverageRatingByBarberId(@Param("barberId") Long barberId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.barber.id = :barberId")
    Long countByBarberId(@Param("barberId") Long barberId);
}