package com.barberapp.backend.service;

import com.barberapp.backend.dto.ReviewDTO;
import com.barberapp.backend.model.Appointment;
import com.barberapp.backend.model.AppointmentStatus;
import com.barberapp.backend.model.Review;
import com.barberapp.backend.model.User;
import com.barberapp.backend.repository.AppointmentRepository;
import com.barberapp.backend.repository.ReviewRepository;
import com.barberapp.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;

    // Create review
    public ReviewDTO create(ReviewDTO dto) {


        // Validates rating
        if (dto.getRating() < 1 || dto.getRating() > 5) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Rating must be between 1 and 5");
        }

        // Verify if the appointment exists and is completed
        Appointment appointment = appointmentRepository
                .findById(dto.getAppointmentId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Appointment not found: " + dto.getAppointmentId()));

        if (!appointment.getClient().getId().equals(dto.getClientId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can only review your own appointments");
        }

        if (appointment.getStatus() != AppointmentStatus.COMPLETED) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Can only review COMPLETED appointments");
        }

        // Verify if the appointment already has a review
        if (reviewRepository.existsByAppointmentId(dto.getAppointmentId())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This appointment has already been reviewed");
        }

        User client = userRepository.findById(dto.getClientId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Client not found: " + dto.getClientId()));

        Review review = Review.builder()
                .rating(dto.getRating())
                .comment(dto.getComment())
                .client(client)
                .barber(appointment.getBarber())
                .appointment(appointment)
                .build();

        return convertToDTO(reviewRepository.save(review));
    }

    // List all barber reviews
    public List<ReviewDTO> getByBarberId(Long barberId) {
        return reviewRepository
                .findByBarberIdOrderByCreatedAtDesc(barberId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Average rating
    public Double getAverageRating(Long barberId) {
        return reviewRepository
                .findAverageRatingByBarberId(barberId)
                .orElse(0.0);
    }

    // Total reviews
    public Long getReviewCount(Long barberId) {
        return reviewRepository.countByBarberId(barberId);
    }

    private ReviewDTO convertToDTO(Review review) {
        return ReviewDTO.builder()
                .id(review.getId())
                .rating(review.getRating())
                .comment(review.getComment())
                .clientId(review.getClient().getId())
                .clientName(review.getClient().getName())
                .barberId(review.getBarber().getId())
                .appointmentId(review.getAppointment().getId())
                .createdAt(review.getCreatedAt())
                .build();
    }
}