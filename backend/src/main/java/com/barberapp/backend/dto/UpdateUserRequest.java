package com.barberapp.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class UpdateUserRequest {
    // Dados de Barbeiros
    private String bio;
    private List<Long> specialtyIds;

    // Dados comuns
    private String phoneNumber;
    private String email;
    private String avatarUrl;
    private String name;
    private AddressDTO address;
}
