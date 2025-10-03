package com.i_you_tea.sportify.dto;

import com.i_you_tea.sportify.entity.TeamMember;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTeamMemberStatusDTO {
    
    @NotNull(message = "Team ID is required")
    private Long teamId;
    
    @NotNull(message = "User ID is required")
    private Long userId;
    
    @NotNull(message = "Status is required")
    private TeamMember.TeamMemberStatus status;
}