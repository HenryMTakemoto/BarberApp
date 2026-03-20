package com.barberapp.backend.service;

import com.barberapp.backend.dto.AuthResponse;
import com.barberapp.backend.dto.GoogleAuthRequestDTO;
import com.barberapp.backend.model.Role;
import com.barberapp.backend.model.User;
import com.barberapp.backend.repository.UserRepository;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collections;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class GoogleAuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final UserService userService;

    @Value("${google.client-id}")
    private String googleClientId;

    // Main entry point — validates Google token and returns our JWT
    public Map<String, Object> authenticate(GoogleAuthRequestDTO request) {

        // Validate the Google idToken
        GoogleIdToken.Payload payload = verifyGoogleToken(request.getIdToken());

        String email = payload.getEmail();
        String name = (String) payload.get("name");
        String avatarUrl = (String) payload.get("picture");

        System.out.println(">>> Google auth for: " + email);

        // Check if user already exists
        Optional<User> existingUser = userRepository.findByEmail(email);

        if (existingUser.isPresent()) {
            // User exists — update avatar if changed and return our JWT
            User user = existingUser.get();
            if (avatarUrl != null && !avatarUrl.equals(user.getAvatarUrl())) {
                user.setAvatarUrl(avatarUrl);
                userRepository.save(user);
            }
            String token = jwtService.generateToken(user.getEmail());
            return Map.of(
                    "status", "EXISTING_USER",
                    "token", token,
                    "user", userService.convertToUserDTO(user)
            );
        }

        // New user — role is required
        if (request.getRole() == null) {
            // Tell the app to ask the user to choose role
            return Map.of(
                    "status", "NEW_USER",
                    "email", email,
                    "name", name != null ? name : "",
                    "avatarUrl", avatarUrl != null ? avatarUrl : ""
            );
        }

        // Create new user with chosen role
        User newUser = User.builder()
                .name(name != null ? name : email)
                .email(email)
                .password("GOOGLE_AUTH_" + email) // Placeholder — Google users don't use password
                .role(request.getRole())
                .avatarUrl(avatarUrl)
                .build();

        User savedUser = userRepository.save(newUser);
        String token = jwtService.generateToken(savedUser.getEmail());

        System.out.println(">>> New user created via Google: " + email
                + " role: " + request.getRole());

        return Map.of(
                "status", "CREATED",
                "token", token,
                "user", userService.convertToUserDTO(savedUser)
        );
    }

    // Validates the Google idToken and returns the payload
    private GoogleIdToken.Payload verifyGoogleToken(String idToken) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier
                    .Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken googleIdToken = verifier.verify(idToken);

            if (googleIdToken == null) {
                throw new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Invalid Google token");
            }

            return googleIdToken.getPayload();

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            System.out.println(">>> Google token verification error: " + e.getMessage());
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Failed to verify Google token");
        }
    }
}