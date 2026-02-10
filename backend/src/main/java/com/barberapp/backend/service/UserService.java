package com.barberapp.backend.service;

import com.barberapp.backend.dto.UpdateUserRequest;
import com.barberapp.backend.model.Role;
import com.barberapp.backend.model.Specialty;
import com.barberapp.backend.model.User;
import com.barberapp.backend.dto.UserDTO;
import com.barberapp.backend.repository.SpecialtyRepository;
import com.barberapp.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final SpecialtyRepository specialtyRepository;

    public UserDTO registerUser(UserDTO userDTO) {
        // Verificar se já existe um usuário com esse email
        if(userRepository.existsByEmail(userDTO.getEmail())) {
            throw new RuntimeException("Email já existente");
        }

        // Transformar o DTO vindo do app em Entidade para usar no BD
        User userToSave = User.builder()
                .name(userDTO.getName())
                .email(userDTO.getEmail())
                .password("123456")  // Por enquanto fixo, pois ainda não há senha
                .phoneNumber(userDTO.getPhoneNumber())
                .role(userDTO.getRole())
                .avatarUrl(userDTO.getAvatarUrl())
                .build();

        // Salvar no banco
        User savedUser = userRepository.save(userToSave);
        // Retorno para saber que foi salvo com sucesso
        userDTO.setId(savedUser.getId());
        return userDTO;

    }

    public UserDTO updateUser(Long userId, UpdateUserRequest dto) {
        // Buscar o usuário
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Atualizar dados
        if (dto.getName() != null) {
            user.setName(dto.getName());
        }
        if (dto.getPhoneNumber() != null) {
            user.setPhoneNumber(dto.getPhoneNumber());
        }
        if (dto.getAvatarUrl() != null) {
        user.setAvatarUrl(dto.getAvatarUrl());
        }

        // Validação para o email
            if (dto.getEmail() != null && !dto.getEmail().equals(user.getEmail())) {
                if (userRepository.existsByEmail(dto.getEmail())) {
                    throw new RuntimeException("Email already in use by another user");
                }
                user.setEmail(dto.getEmail());
                }
        // Atualizar dados do barbeiro
        if (dto.getBio() != null){
            user.setBio(dto.getBio());
        }
        if (dto.getSpecialtyIds() != null){
            List<Specialty> foundSpecialties = specialtyRepository.findAllById(dto.getSpecialtyIds());
            user.setSpecialties(new HashSet<>(foundSpecialties));

            // Se adicionou especialidades, garante que vira Barbeiro
            if(!foundSpecialties.isEmpty()){
                user.setRole(Role.BARBER);
            }
        }
        User savedUser = userRepository.save(user);
        return convertToUserDTO(savedUser);
    }

    // Método Auxiliar
    private UserDTO convertToUserDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setPhoneNumber(user.getPhoneNumber());
        dto.setAvatarUrl(user.getAvatarUrl());
        dto.setRole(user.getRole());

        // Converte as especialidades de Entidade para String
        if (user.getSpecialties() != null) {
            Set<String> specialtyNames = user.getSpecialties().stream()
                    .map(Specialty::getName)
                    .collect(Collectors.toSet());
            dto.setSpecialties(specialtyNames);
        }
        return dto;
    }
}