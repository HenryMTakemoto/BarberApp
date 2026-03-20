package com.barberapp.backend.config;

import com.barberapp.backend.model.User;
import com.barberapp.backend.repository.UserRepository;
import com.barberapp.backend.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        String method = request.getMethod();
        // Rotas públicas — filtro não precisa agir
        return (method.equals("POST") && path.equals("/api/auth/login")) ||
                (method.equals("POST") && path.equals("/api/users")) ||
                (method.equals("GET")  && path.startsWith("/api/users/nearby-barbers")) ||
                (method.equals("GET")  && path.startsWith("/api/specialties"));
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        System.out.println(">>> FILTER: " + request.getMethod()
                + " " + request.getServletPath());
        System.out.println(">>> AUTH HEADER: "
                + request.getHeader("Authorization"));

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println(">>> No valid auth header, passing through");
            filterChain.doFilter(request, response);
            return;
        }

        try {
            final String jwt = authHeader.substring(7);
            final String userEmail = jwtService.extractEmail(jwt);
            System.out.println(">>> Extracted email: " + userEmail);
            System.out.println(">>> Token expired: " + (userEmail == null));

            if (userEmail != null &&
                    SecurityContextHolder.getContext().getAuthentication() == null) {

                Optional<User> optionalUser = userRepository.findByEmail(userEmail);
                System.out.println(">>> User found: " + optionalUser.isPresent());

                if (optionalUser.isPresent()) {
                    boolean valid = jwtService.isTokenValid(jwt, userEmail);
                    System.out.println(">>> Token valid: " + valid);

                    if (valid) {
                        User user = optionalUser.get();
                        List<SimpleGrantedAuthority> authorities = List.of(
                                new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
                        UsernamePasswordAuthenticationToken authToken =
                                new UsernamePasswordAuthenticationToken(
                                        user, null, authorities);
                        authToken.setDetails(
                                new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                        System.out.println(">>> Authentication set for: " + userEmail);
                    }
                }
            }
        } catch (Exception e) {
            System.out.println(">>> JWT Filter error: " + e.getMessage());
            e.printStackTrace();
        }

        filterChain.doFilter(request, response);
    }
}