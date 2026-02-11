package com.barberapp.backend.controller;

import com.barberapp.backend.dto.UpdateUserRequest;
import com.barberapp.backend.dto.UserDTO;
import com.barberapp.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    // PUT: Atualizar Perfil (Pessoal e/ou Barbeiro)
    @PutMapping("/{id}")
    public ResponseEntity<UserDTO> updateProfile(
            @PathVariable Long id,
            @RequestBody UpdateUserRequest dto) {

        UserDTO updatedUser = userService.updateUser(id, dto);
        return ResponseEntity.ok(updatedUser);
    }

    // GET: Radar de Barbeiros
    @GetMapping("/nearby-barbers")
    public ResponseEntity<List<UserDTO>> getNearbyBarbers(
            @RequestParam Double lat,
            @RequestParam Double lng,
            @RequestParam(defaultValue = "3.0") Double radius) { // Se o App não enviar raio, usamos 3km como padrão

        List<UserDTO> barbers = userService.getNearbyBarbers(lat, lng, radius);
        return ResponseEntity.ok(barbers);
    }
}
