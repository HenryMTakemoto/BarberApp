package com.barberapp.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Builder;
import java.util.Set;
import java.util.HashSet;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")

public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    private String phoneNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    private String avatarUrl;

    @ManyToMany(fetch = FetchType.EAGER) // Um user (barbeiro) pode ter várias especialidades
    @JoinTable(
            name = "user_specialties", // Nome da tabela de junção
            joinColumns = @JoinColumn(name = "user_id"), // Coluna do user
            inverseJoinColumns = @JoinColumn(name = "specialty_id") // Coluna da especialidade
    )
    // Inicializar com newHashSet para nunca ser 'null'
    @Builder.Default
    private Set<Specialty> specialties = new HashSet<>(); // Uso de Set para evitar duplicados

}
