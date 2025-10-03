package com.i_you_tea.sportify.dto;

import com.i_you_tea.sportify.entity.TeamMember;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TeamMemberDTO {
    
    private Long teamId;
    private String teamName;
    private Long userId;
    private String userName;
    private String userEmail;
    private String roleInTeam;
    private TeamMember.TeamMemberStatus status;
    
    public static TeamMemberDTO fromEntity(TeamMember teamMember) {
        return new TeamMemberDTO(
            teamMember.getTeam() != null ? teamMember.getTeam().getTeamId() : null,
            teamMember.getTeam() != null ? teamMember.getTeam().getTeamName() : null,
            teamMember.getUser() != null ? teamMember.getUser().getUserId() : null,
            teamMember.getUser() != null ? teamMember.getUser().getName() : null,
            teamMember.getUser() != null ? teamMember.getUser().getEmail() : null,
            teamMember.getRoleInTeam(),
            teamMember.getStatus()
        );
    }
}