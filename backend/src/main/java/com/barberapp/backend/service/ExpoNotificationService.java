package com.barberapp.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.HttpEntity;

import java.util.HashMap;
import java.util.Map;

@Service
public class ExpoNotificationService {

    private final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

    public void sendPushNotification(String expoPushToken, String title, String body) {
        if (expoPushToken == null || expoPushToken.trim().isEmpty() || !expoPushToken.startsWith("ExponentPushToken")) {
            return;
        }

        RestTemplate restTemplate = new RestTemplate();
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        Map<String, Object> message = new HashMap<>();
        message.put("to", expoPushToken);
        message.put("sound", "default");
        message.put("title", title);
        message.put("body", body);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(message, headers);
        
        try {
            restTemplate.postForObject(EXPO_PUSH_URL, request, String.class);
            System.out.println("Push notification sent to " + expoPushToken);
        } catch (Exception e) {
            System.err.println("Failed to send push notification: " + e.getMessage());
        }
    }
}
