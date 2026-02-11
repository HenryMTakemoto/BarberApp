package com.barberapp.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "addresses")
public class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String street;
    private String number;
    private String city;
    private String state;
    private String zipCode;

    // Coordenadas exatas para o Mapa (GPS)
    private Double latitude;
    private Double longitude;
}
