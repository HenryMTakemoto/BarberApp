package com.barberapp.backend.dto;

import lombok.Data;

@Data
public class AddressDTO {
    private String street;
    private String number;
    private String city;
    private String state;
    private String zipCode;
    private Double latitude;
    private Double longitude;
}