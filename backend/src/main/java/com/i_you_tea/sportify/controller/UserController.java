package com.i_you_tea.sportify.controller;

import com.i_you_tea.sportify.dto.UserDTO;
import com.i_you_tea.sportify.entity.User;
import com.i_you_tea.sportify.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {
    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        List<UserDTO> userDTOs = users.stream()
                .map(UserDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(userDTOs);
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getCurrentUserProfile(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            User currentUser = (User) userDetails;
            UserDTO userDTO = UserDTO.fromEntity(currentUser);
            return ResponseEntity.ok(userDTO);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error retrieving user profile"));
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@AuthenticationPrincipal UserDetails userDetails,
            @RequestBody UserDTO updateRequest) {
        try {
            User currentUser = (User) userDetails;

            // Update only allowed fields (not password, email, username)
            if (updateRequest.getName() != null) {
                currentUser.setName(updateRequest.getName());
            }
            if (updateRequest.getPhone() != null) {
                currentUser.setPhone(updateRequest.getPhone());
            }
            if (updateRequest.getProfilePhoto() != null) {
                currentUser.setProfilePhoto(updateRequest.getProfilePhoto());
            }

            User updatedUser = userService.updateUser(currentUser);
            UserDTO responseDTO = UserDTO.fromEntity(updatedUser);

            return ResponseEntity.ok(responseDTO);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error updating user profile"));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        try {
            Optional<User> userOptional = userService.findById(id);
            if (userOptional.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "User not found"));
            }

            UserDTO userDTO = UserDTO.fromEntity(userOptional.get());
            return ResponseEntity.ok(userDTO);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error retrieving user"));
        }
    }
}