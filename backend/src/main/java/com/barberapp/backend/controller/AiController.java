package com.barberapp.backend.controller;

import com.barberapp.backend.service.AiInsightsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiInsightsService aiInsightsService;

    // Return AI tips for barber based on his schedule/revenue
    @GetMapping("/barbers/{barberId}/insights")
    public ResponseEntity<List<String>> getBarberInsights(@PathVariable Long barberId) {
        List<String> insights = aiInsightsService.getBarberInsights(barberId);
        return ResponseEntity.ok(insights);
    }

    // Return the best barber for client
    @GetMapping("/clients/{clientId}/recommendation")
    public ResponseEntity<Map<String, Object>> getClientRecommendation(
            @PathVariable Long clientId,
            @RequestParam Double lat,
            @RequestParam Double lng) {

        Map<String, Object> recommendation = aiInsightsService.getClientRecommendation(clientId, lat, lng);
        return ResponseEntity.ok(recommendation);
    }
}
