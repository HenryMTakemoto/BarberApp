package com.barberapp.backend.controller;

import com.barberapp.backend.dto.AuthResponse;
import com.barberapp.backend.dto.GoogleAuthRequestDTO;
import com.barberapp.backend.dto.LoginRequest;
import com.barberapp.backend.dto.UserDTO;
import com.barberapp.backend.service.GoogleAuthService;
import com.barberapp.backend.service.JwtService;
import com.barberapp.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final JwtService jwtService;
    private final GoogleAuthService googleAuthService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        System.out.println(">>> LOGIN chamado para: " + request.getEmail());
        UserDTO loggedUser = userService.login(request);
        String token = jwtService.generateToken(loggedUser.getEmail());
        System.out.println(">>> Token: " + token.substring(0, 20) + "...");
        return ResponseEntity.ok(AuthResponse.builder()
                .token(token)
                .user(loggedUser)
                .build());
    }

    // Google OAuth2 — receives idToken from React Native
    @PostMapping("/google")
    public ResponseEntity<Map<String, Object>> googleAuth(
            @RequestBody GoogleAuthRequestDTO request) {
        return ResponseEntity.ok(googleAuthService.authenticate(request));
    }
}