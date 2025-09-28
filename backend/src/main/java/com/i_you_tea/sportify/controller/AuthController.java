package com.i_you_tea.sportify.controller;

import com.i_you_tea.sportify.Config.JWTService;
import com.i_you_tea.sportify.dto.*;
import com.i_you_tea.sportify.entity.User;
import com.i_you_tea.sportify.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final JWTService jwtService;
    private final AuthenticationManager authenticationManager;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequestDTO loginRequest) {
        try {
            // Authenticate user with email and password
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(),
                            loginRequest.getPassword()));

            // Find user by email
            Optional<User> userOptional = userService.findByEmail(loginRequest.getEmail());
            if (userOptional.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid email or password"));
            }

            User user = userOptional.get();
            UserDetails userDetails = user; // User implements UserDetails

            // Generate tokens
            String token = jwtService.generateToken(userDetails);
            Map<String, Object> refreshClaims = new HashMap<>();
            String refreshToken = jwtService.generateRefreshToken(refreshClaims, userDetails);

            // Save refresh token
            jwtService.saveRefreshToken(user.getUserId(), refreshToken);

            // Create response
            UserDTO userDTO = UserDTO.fromEntity(user);
            AuthResponseDTO response = new AuthResponseDTO(token, refreshToken, userDTO);

            return ResponseEntity.ok(response);

        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid email or password"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "An error occurred during login"));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequestDTO registerRequest) {
        try {
            // Check if email already exists
            if (userService.existsByEmail(registerRequest.getEmail())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Email already exists"));
            }

            // Check if username already exists
            if (userService.existsByUsername(registerRequest.getUsername())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Username already exists"));
            }

            // Create new user
            User newUser = new User();
            newUser.setName(registerRequest.getName());
            newUser.setUserName(registerRequest.getUsername());
            newUser.setEmail(registerRequest.getEmail());
            newUser.setPassword(registerRequest.getPassword()); // Will be encoded in service
            newUser.setRole(registerRequest.getRole() != null ? registerRequest.getRole() : User.UserRole.PLAYER);

            // Save user
            User savedUser = userService.saveUser(newUser);

            // Generate tokens for automatic login after registration
            UserDetails userDetails = savedUser;
            String token = jwtService.generateToken(userDetails);
            Map<String, Object> refreshClaims = new HashMap<>();
            String refreshToken = jwtService.generateRefreshToken(refreshClaims, userDetails);

            // Save refresh token
            jwtService.saveRefreshToken(savedUser.getUserId(), refreshToken);

            // Create response
            UserDTO userDTO = UserDTO.fromEntity(savedUser);
            AuthResponseDTO response = new AuthResponseDTO(token, refreshToken, userDTO);
            response.setMessage("Registration successful");

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "An error occurred during registration"));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestBody RefreshTokenRequestDTO refreshRequest) {
        try {
            String refreshToken = refreshRequest.getRefreshToken();
            String email = jwtService.extractUserName(refreshToken);

            Optional<User> userOptional = userService.findByEmail(email);
            if (userOptional.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid refresh token"));
            }

            User user = userOptional.get();

            // Validate refresh token
            if (!jwtService.validateRefreshToken(user.getUserId(), refreshToken)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid refresh token"));
            }

            // Generate new tokens
            UserDetails userDetails = user;
            String newToken = jwtService.generateToken(userDetails);
            Map<String, Object> refreshClaims = new HashMap<>();
            String newRefreshToken = jwtService.generateRefreshToken(refreshClaims, userDetails);

            // Save new refresh token and delete old one
            jwtService.deleteRefreshToken(user.getUserId());
            jwtService.saveRefreshToken(user.getUserId(), newRefreshToken);

            // Create response
            UserDTO userDTO = UserDTO.fromEntity(user);
            AuthResponseDTO response = new AuthResponseDTO(newToken, newRefreshToken, userDTO);
            response.setMessage("Token refreshed successfully");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid refresh token"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestBody RefreshTokenRequestDTO refreshRequest) {
        try {
            String refreshToken = refreshRequest.getRefreshToken();
            String email = jwtService.extractUserName(refreshToken);

            Optional<User> userOptional = userService.findByEmail(email);
            if (userOptional.isPresent()) {
                User user = userOptional.get();
                jwtService.deleteRefreshToken(user.getUserId());
            }

            return ResponseEntity.ok(Map.of("message", "Logged out successfully"));

        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
        }
    }
}
