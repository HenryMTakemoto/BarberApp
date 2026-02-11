package com.barberapp.backend.controller;

import com.barberapp.backend.dto.LoginRequest;
import com.barberapp.backend.dto.UserDTO;
import com.barberapp.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    // POST: Fazer Login
    // URL: http://localhost:8080/api/auth/login
    @PostMapping("/login")
    public ResponseEntity<UserDTO> login(@RequestBody LoginRequest request) {
        UserDTO loggedUser = userService.login(request);
        return ResponseEntity.ok(loggedUser);
    }
}