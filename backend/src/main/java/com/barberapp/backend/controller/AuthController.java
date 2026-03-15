package com.barberapp.backend.controller;

import com.barberapp.backend.dto.AuthResponse;
import com.barberapp.backend.dto.LoginRequest;
import com.barberapp.backend.dto.UserDTO;
import com.barberapp.backend.service.JwtService;
import com.barberapp.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        System.out.println(">>> LOGIN chamado para: " + request.getEmail());
        UserDTO loggedUser = userService.login(request);
        System.out.println(">>> UserDTO: " + loggedUser);
        String token = jwtService.generateToken(loggedUser.getEmail());
        System.out.println(">>> Token: " + token.substring(0, 20) + "...");
        AuthResponse response = AuthResponse.builder()
                .token(token)
                .user(loggedUser)
                .build();
        return ResponseEntity.ok(response);
    }
}