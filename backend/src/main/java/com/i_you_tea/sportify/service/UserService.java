package com.i_you_tea.sportify.service;

import com.i_you_tea.sportify.Config.JWTService;
import com.i_you_tea.sportify.entity.User;
import com.i_you_tea.sportify.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JWTService jwtService;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUserName(username);
    }

    public User saveUser(User user) {
        // Encode password before saving
        if (user.getPassword() != null) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        return userRepository.save(user);
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    public boolean existsByUsername(String username) {
        return userRepository.existsByUserName(username);
    }

    public User updateUser(User user) {
        return userRepository.save(user);
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> getCurrentUserFromToken(String token) {
        try {
            // Extract the JWT token from Authorization header (remove "Bearer " prefix)
            String jwt = token;
            if (token.startsWith("Bearer ")) {
                jwt = token.substring(7);
            }
            
            // Extract username from JWT token
            String username = jwtService.extractUserName(jwt);
            
            if (username != null) {
                // Find user by username
                return findByUsername(username);
            }
            
            return Optional.empty();
        } catch (Exception e) {
            // Log the error if needed
            return Optional.empty();
        }
    }
}