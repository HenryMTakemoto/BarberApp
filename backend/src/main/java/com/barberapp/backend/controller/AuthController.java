package com.barberapp.backend.controller;

import com.barberapp.backend.dto.LoginRequest;
import com.barberapp.backend.dto.UserDTO;
import com.barberapp.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.barberapp.backend.service.JwtService;
import com.barberapp.backend.dto.AuthResponse;


@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final JwtService jwtService;


    // POST: Fazer Login
    // URL: http://localhost:8080/api/auth/login
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        UserDTO user = userService.login(request);
        String token = jwtService.generateToken(user.getEmail());
        return ResponseEntity.ok(new AuthResponse(token, user));
    }
}