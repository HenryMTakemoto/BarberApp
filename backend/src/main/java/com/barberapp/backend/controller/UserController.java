package com.barberapp.backend.controller;

import com.barberapp.backend.dto.UpdateUserRequest;
import com.barberapp.backend.dto.UserDTO;
import com.barberapp.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping
    public ResponseEntity<UserDTO> createUser(@RequestBody UserDTO userDTO) {
        UserDTO newUser = userService.registerUser(userDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(newUser);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserDTO> updateProfile(
            @PathVariable Long id,
            @RequestBody UpdateUserRequest dto) {
        UserDTO updatedUser = userService.updateUser(id, dto);
        return ResponseEntity.ok(updatedUser);
    }

    @GetMapping("/nearby-barbers")
    public ResponseEntity<List<UserDTO>> getNearbyBarbers(
            @RequestParam(name = "lat") Double lat,
            @RequestParam(name = "lng") Double lng,
            @RequestParam(name = "radius", defaultValue = "3.0") Double radius,
            @RequestParam(name = "specialty", required = false) String specialty) {
        return ResponseEntity.ok(
                userService.getNearbyBarbers(lat, lng, radius, specialty));
    }
    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }


}