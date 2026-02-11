package com.barberapp.backend.service;

import com.barberapp.backend.dto.AddressDTO;
import com.barberapp.backend.dto.UpdateUserRequest;
import com.barberapp.backend.model.Address;
import com.barberapp.backend.model.Role;
import com.barberapp.backend.model.Specialty;
import com.barberapp.backend.model.User;
import com.barberapp.backend.dto.UserDTO;
import com.barberapp.backend.repository.SpecialtyRepository;
import com.barberapp.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import com.barberapp.backend.dto.LoginRequest;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final SpecialtyRepository specialtyRepository;
    private final PasswordEncoder passwordEncoder;

    public UserDTO registerUser(UserDTO userDTO) {
        // Verificar se já existe um usuário com esse email
        if(userRepository.existsByEmail(userDTO.getEmail())) {
            throw new RuntimeException("Email já existente");
        }

        String senhaCriptografada = passwordEncoder.encode("123456");

        // Transformar o DTO vindo do app em Entidade para usar no BD
        User userToSave = User.builder()
                .name(userDTO.getName())
                .email(userDTO.getEmail())
                .password(senhaCriptografada) // Por enquanto fixo, pois ainda não há senha
                .phoneNumber(userDTO.getPhoneNumber())
                .role(Role.CLIENT)
                .avatarUrl(userDTO.getAvatarUrl())
                .build();

        // Salvar no banco
        User savedUser = userRepository.save(userToSave);
        // Retorno para saber que foi salvo com sucesso
        userDTO.setId(savedUser.getId());
        return userDTO;

    }

    // Fazer Login
    public UserDTO login(LoginRequest request) {
        // Tenta encontrar o usuário pelo email
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        // Compara a senha digitada com a Hash do banco
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            // Se não bater, Erro 401 (Não Autorizado)
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        // Se a senha estiver certa, devolvemos os dados do usuário
        return convertToUserDTO(user);
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
        // --- ATUALIZAÇÃO DO ENDEREÇO ---
        if (dto.getAddress() != null) {
            AddressDTO addrDto = dto.getAddress();

            // Se o utilizador ainda não tem morada, criamos uma nova
            if (user.getAddress() == null) {
                user.setAddress(new Address());
            }

            // Atualizamos os campos
            if (addrDto.getStreet() != null) user.getAddress().setStreet(addrDto.getStreet());
            if (addrDto.getNumber() != null) user.getAddress().setNumber(addrDto.getNumber());
            if (addrDto.getCity() != null) user.getAddress().setCity(addrDto.getCity());
            if (addrDto.getState() != null) user.getAddress().setState(addrDto.getState());
            if (addrDto.getZipCode() != null) user.getAddress().setZipCode(addrDto.getZipCode());
            if (addrDto.getLatitude() != null) user.getAddress().setLatitude(addrDto.getLatitude());
            if (addrDto.getLongitude() != null) user.getAddress().setLongitude(addrDto.getLongitude());
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
        // Converte o Endereço (se existir)
        if (user.getAddress() != null) {
            AddressDTO addrDto = new AddressDTO();
            addrDto.setStreet(user.getAddress().getStreet());
            addrDto.setNumber(user.getAddress().getNumber());
            addrDto.setCity(user.getAddress().getCity());
            addrDto.setState(user.getAddress().getState());
            addrDto.setZipCode(user.getAddress().getZipCode());
            addrDto.setLatitude(user.getAddress().getLatitude());
            addrDto.setLongitude(user.getAddress().getLongitude());
            dto.setAddress(addrDto);
        }
        return dto;
    }

    // Função do Radar
    public List<UserDTO> getNearbyBarbers(Double lat, Double lng, Double radiusKm) {
        // O banco de dados traz a lista filtrada
        List<User> nearbyBarbers = userRepository.findNearbyBarbers(lat, lng, radiusKm);

        // Convertê-los para DTO e preencher a distância exata
        return nearbyBarbers.stream().map(user -> {
            UserDTO dto = convertToUserDTO(user);

            // Calcula a distância para exibir no App
            double distance = calculateHaversineDistance(
                    lat, lng,
                    user.getAddress().getLatitude(),
                    user.getAddress().getLongitude()
            );

            // Arredonda para 1 casa decimal (ex: 2.3 km)
            dto.setDistanceKm(Math.round(distance * 10.0) / 10.0);

            return dto;
        }).collect(Collectors.toList());
    }

    // Fórmula de Haversine
    private double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        final int EARTH_RADIUS = 6371; // Raio da terra em Km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS * c;
    }
}