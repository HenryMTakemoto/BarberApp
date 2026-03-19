package com.barberapp.backend.controller;

import com.barberapp.backend.dto.ReviewDTO;
import com.barberapp.backend.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    // POST — create review (requires token)
    @PostMapping("/api/reviews")
    public ResponseEntity<ReviewDTO> create(@RequestBody ReviewDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reviewService.create(dto));
    }

    // GET — barber reviews (public)
    @GetMapping("/api/barbers/{barberId}/reviews")
    public ResponseEntity<List<ReviewDTO>> getByBarber(
            @PathVariable Long barberId) {
        return ResponseEntity.ok(reviewService.getByBarberId(barberId));
    }

    // GET — barber average rating (public)
    @GetMapping("/api/barbers/{barberId}/rating")
    public ResponseEntity<Map<String, Object>> getRating(
            @PathVariable Long barberId) {
        Double avg = reviewService.getAverageRating(barberId);
        Long count = reviewService.getReviewCount(barberId);
        return ResponseEntity.ok(Map.of(
                "barberId", barberId,
                "averageRating", Math.round(avg * 10.0) / 10.0,
                "reviewCount", count
        ));
    }
}