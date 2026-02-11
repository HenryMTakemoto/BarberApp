package com.barberapp.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data // Gera Getters, Setters, toString...
@Builder // Permite criar objetos de forma fluida
@NoArgsConstructor // Obrigatório para o JPA/Hibernate
@AllArgsConstructor
@Entity // Diz que isso é uma tabela no banco
@Table(name = "appointments")
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime date; // Data e Hora do corte

    @Enumerated(EnumType.STRING) // Salva no banco como texto ("PENDING") e não número (0)
    @Column(nullable = false)
    private AppointmentStatus status;

    // RELACIONAMENTOS (Chaves Estrangeiras)

    // Quem vai cortar o cabelo? (Cliente)
    @ManyToOne(fetch = FetchType.LAZY) // Lazy = só carrega os dados do cliente se a gente pedir
    @JoinColumn(name = "client_id", nullable = false)
    private User client;

    // Quem vai realizar o corte? (Barbeiro)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "barber_id", nullable = false)
    private User barber;

    // Qual o serviço? (Ex: Barba, Cabelo)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "specialty_id", nullable = false)
    private Specialty specialty;
}