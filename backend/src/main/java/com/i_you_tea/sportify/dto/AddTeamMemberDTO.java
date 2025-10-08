package com.i_you_tea.sportify.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddTeamMemberDTO {
    
    @NotNull(message = "Team ID is required")
    private Long teamId;
    
    @NotNull(message = "User ID is required")
    private Long userId;
    
    @Size(max = 50, message = "Role in team must not exceed 50 characters")
    private String roleInTeam;
}