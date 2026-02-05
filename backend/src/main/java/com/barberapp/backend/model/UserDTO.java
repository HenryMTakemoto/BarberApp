package com.barberapp.backend.model;

import com.barberapp.backend.model.Role;
import lombok.Data;

@Data
public class UserDTO {
    private Long id;
    private String name;
    private String email;
    private String phoneNumber;
    private Role role;
    private String avatarUrl;
}
