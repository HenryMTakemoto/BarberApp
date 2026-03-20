package com.barberapp.backend.service;

import com.barberapp.backend.dto.AddressDTO;
import com.barberapp.backend.dto.LoginRequest;
import com.barberapp.backend.dto.UpdateUserRequest;
import com.barberapp.backend.dto.UserDTO;
import com.barberapp.backend.model.Address;
import com.barberapp.backend.model.Role;
import com.barberapp.backend.model.Specialty;
import com.barberapp.backend.model.User;
import com.barberapp.backend.repository.ReviewRepository;
import com.barberapp.backend.repository.SpecialtyRepository;
import com.barberapp.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final SpecialtyRepository specialtyRepository;
    private final PasswordEncoder passwordEncoder;
    private final ReviewRepository reviewRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    public UserDTO registerUser(UserDTO userDTO) {
        if (userRepository.existsByEmail(userDTO.getEmail())) {
            throw new RuntimeException("Email já existente");
        }
        if (userDTO.getPassword() == null || userDTO.getPassword().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Senha é obrigatória");
        }
        String senhaCriptografada = passwordEncoder.encode(userDTO.getPassword());
        User userToSave = User.builder()
                .name(userDTO.getName())
                .email(userDTO.getEmail())
                .password(senhaCriptografada)
                .phoneNumber(userDTO.getPhoneNumber())
                .role(Role.CLIENT)
                .avatarUrl(userDTO.getAvatarUrl())
                .build();
        User savedUser = userRepository.save(userToSave);
        return convertToUserDTO(savedUser);
    }

    public UserDTO login(LoginRequest request) {
        System.out.println(">>> Buscando usuário: " + request.getEmail());

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        System.out.println(">>> Usuário encontrado: " + user.getName());
        System.out.println(">>> Hash no banco: " + user.getPassword());

        try {
            boolean matches = passwordEncoder.matches(request.getPassword(), user.getPassword());
            System.out.println(">>> Senha bate? " + matches);

            if (!matches) {
                throw new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Invalid email or password");
            }
        } catch (Exception e) {
            System.out.println(">>> ERRO no BCrypt: " + e.getMessage());
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        return convertToUserDTO(user);
    }

    public UserDTO updateUser(Long userId, UpdateUserRequest dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (dto.getName() != null) user.setName(dto.getName());
        if (dto.getPhoneNumber() != null) user.setPhoneNumber(dto.getPhoneNumber());
        if (dto.getAvatarUrl() != null) user.setAvatarUrl(dto.getAvatarUrl());
        if (dto.getEmail() != null && !dto.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(dto.getEmail()))
                throw new RuntimeException("Email already in use by another user");
            user.setEmail(dto.getEmail());
        }
        if (dto.getBio() != null) user.setBio(dto.getBio());
        if (dto.getSpecialtyIds() != null) {
            List<Specialty> foundSpecialties =
                    specialtyRepository.findAllById(dto.getSpecialtyIds());
            user.setSpecialties(new HashSet<>(foundSpecialties));
            if (!foundSpecialties.isEmpty()) user.setRole(Role.BARBER);
        }
        if (dto.getAddress() != null) {
            AddressDTO addrDto = dto.getAddress();
            if (user.getAddress() == null) user.setAddress(new Address());
            if (addrDto.getStreet() != null)
                user.getAddress().setStreet(addrDto.getStreet());
            if (addrDto.getNumber() != null)
                user.getAddress().setNumber(addrDto.getNumber());
            if (addrDto.getCity() != null)
                user.getAddress().setCity(addrDto.getCity());
            if (addrDto.getState() != null)
                user.getAddress().setState(addrDto.getState());
            if (addrDto.getZipCode() != null)
                user.getAddress().setZipCode(addrDto.getZipCode());
            if (addrDto.getLatitude() != null)
                user.getAddress().setLatitude(addrDto.getLatitude());
            if (addrDto.getLongitude() != null)
                user.getAddress().setLongitude(addrDto.getLongitude());
        }
        return convertToUserDTO(userRepository.save(user));
    }

    public List<UserDTO> getNearbyBarbers(Double lat, Double lng, Double radiusKm) {
        return userRepository.findNearbyBarbers(lat, lng, radiusKm).stream().map(user -> {
            UserDTO dto = convertToUserDTO(user);
            double distance = calculateHaversineDistance(
                    lat, lng,
                    user.getAddress().getLatitude(),
                    user.getAddress().getLongitude());
            dto.setDistanceKm(Math.round(distance * 10.0) / 10.0);
            return dto;
        }).collect(Collectors.toList());
    }

    public UserDTO convertToUserDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setPhoneNumber(user.getPhoneNumber());
        dto.setAvatarUrl(user.getAvatarUrl());
        dto.setRole(user.getRole());
        if (user.getSpecialties() != null) {
            dto.setSpecialties(user.getSpecialties().stream()
                    .map(Specialty::getName)
                    .collect(Collectors.toSet()));
        }
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
        // Populate rating and review count for barbers
        if (user.getRole() == Role.BARBER) {
            dto.setRating(
                    Math.round(reviewRepository.findAverageRatingByBarberId(user.getId())
                            .orElse(0.0) * 10.0) / 10.0
            );
            dto.setReviewCount(reviewRepository.countByBarberId(user.getId()));
        }
        return dto;
    }

    private double calculateHaversineDistance(double lat1, double lon1,
                                              double lat2, double lon2) {
        final int R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    public UserDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found with id: " + id));
        return convertToUserDTO(user);
    }
}