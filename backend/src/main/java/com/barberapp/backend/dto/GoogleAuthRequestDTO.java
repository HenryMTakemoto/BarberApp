package com.barberapp.backend.dto;

import com.barberapp.backend.model.Role;
import lombok.Data;

@Data
public class GoogleAuthRequestDTO {
    private String idToken;  //
    private Role role;       // CLIENT or BARBER — necessary just in first login
}