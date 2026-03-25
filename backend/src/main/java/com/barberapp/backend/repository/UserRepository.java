package com.barberapp.backend.repository;

import com.barberapp.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;


@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    // Busca barbeiros próximos ordenados pela distância
    @Query(value = "SELECT * FROM users u " +
            "WHERE u.role = 'BARBER' AND (u.is_online IS NULL OR u.is_online = true) " +
            "AND u.id IN (" +
            "  SELECT u2.id FROM users u2 " +
            "  JOIN addresses a ON u2.address_id = a.id " +
            "  LEFT JOIN user_specialties us ON u2.id = us.user_id " +
            "  LEFT JOIN specialties s ON us.specialty_id = s.id " +
            "  WHERE (6371 * acos(cos(radians(:lat)) * cos(radians(a.latitude)) * " +
            "  cos(radians(a.longitude) - radians(:lng)) + " +
            "  sin(radians(:lat)) * sin(radians(a.latitude)))) <= :radius " +
            "  AND (:specialty IS NULL OR LOWER(s.name) = LOWER(:specialty))" +
            ") " +
            "ORDER BY (SELECT 6371 * acos(cos(radians(:lat)) * cos(radians(a2.latitude)) * " +
            "cos(radians(a2.longitude) - radians(:lng)) + " +
            "sin(radians(:lat)) * sin(radians(a2.latitude))) " +
            "FROM addresses a2 WHERE a2.id = u.address_id) ASC",
            nativeQuery = true)
    List<User> findNearbyBarbersFiltered(
            @Param("lat") Double lat,
            @Param("lng") Double lng,
            @Param("radius") Double radius,
            @Param("specialty") String specialty);
}
