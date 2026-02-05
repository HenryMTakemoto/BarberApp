package com.barberapp.backend.controller;

import com.barberapp.backend.dto.UserDTO;
import com.barberapp.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController // Json
@RequestMapping("api/users") // Endereço
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // Endpoint para criar usuário: POST /api/users
    @PostMapping
    public ResponseEntity<UserDTO> createUser(@RequestBody UserDTO userDTO) {
        // Chama o método de registro de usuário
        UserDTO newUser = userService.registerUser(userDTO);

        // status 201 (Created) e json do usuário criado
        return ResponseEntity.status(HttpStatus.CREATED).body(newUser);

    }
}
