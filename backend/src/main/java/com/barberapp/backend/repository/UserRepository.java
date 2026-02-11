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
    @Query(value = "SELECT u.* FROM users u " +
            "JOIN addresses a ON u.address_id = a.id " +
            "WHERE u.role = 'BARBER' " +
            "AND (6371 * acos(cos(radians(:lat)) * cos(radians(a.latitude)) * " +
            "cos(radians(a.longitude) - radians(:lng)) + " +
            "sin(radians(:lat)) * sin(radians(a.latitude)))) <= :radius " +
            "ORDER BY (6371 * acos(cos(radians(:lat)) * cos(radians(a.latitude)) * " +
            "cos(radians(a.longitude) - radians(:lng)) + " +
            "sin(radians(:lat)) * sin(radians(a.latitude)))) ASC",
            nativeQuery = true)
    List<User> findNearbyBarbers(
            @Param("lat") Double lat,
            @Param("lng") Double lng,
            @Param("radius") Double radius);
}
