package com.i_you_tea.sportify.dto;

import com.i_you_tea.sportify.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    
    private Long userId;
    private String name;
    private String email;
    private String phone;
    private User.UserRole role;
    private String profilePhoto;
    
    public static UserDTO fromEntity(User user) {
        return new UserDTO(
            user.getUserId(),
            user.getName(),
            user.getEmail(),
            user.getPhone(),
            user.getRole(),
            user.getProfilePhoto()
        );
    }
    
    public User toEntity() {
        User user = new User();
        user.setUserId(this.userId);
        user.setName(this.name);
        user.setEmail(this.email);
        user.setPhone(this.phone);
        user.setRole(this.role);
        user.setProfilePhoto(this.profilePhoto);
        return user;
    }
}