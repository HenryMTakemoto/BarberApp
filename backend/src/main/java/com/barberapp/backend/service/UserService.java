package com.barberapp.backend.service;

import com.barberapp.backend.model.User;
import com.barberapp.backend.dto.UserDTO;
import com.barberapp.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

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
}
