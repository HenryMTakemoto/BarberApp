package com.barberapp.backend.dto;

import com.barberapp.backend.model.Role;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.Set;

@Data
public class UserDTO {
    private Long id;
    private String name;
    private String email;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY) // entra no registro,mas não volta nas respostas JSON
    private String password;

    private String phoneNumber;
    private Role role;
    private String avatarUrl;
    private Set<String> specialties;
    private AddressDTO address;
    private Double distanceKm;
}
