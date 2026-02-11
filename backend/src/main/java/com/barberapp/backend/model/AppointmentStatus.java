package com.barberapp.backend.model;

public enum AppointmentStatus {
    PENDING,    // Aguardando confirmação
    CONFIRMED,  // Barbeiro aceitou
    CANCELED,   // Alguém cancelou
    COMPLETED   // Corte realizado
}