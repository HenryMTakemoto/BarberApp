package com.barberapp.backend.dto;

import com.barberapp.backend.model.Role;
import lombok.Data;
import java.util.Set;

@Data
public class UserDTO {
    private Long id;
    private String name;
    private String email;
    private String phoneNumber;
    private Role role;
    private String avatarUrl;
    private Set<String> specialties;
}
