package com.i_you_tea.sportify.dto;

import com.i_you_tea.sportify.entity.Team;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TeamDTO {
    
    private Long teamId;
    private String teamName;
    private Long sportId;
    private String sportName;
    private Long createdById;
    private String createdByName;
    private String logo;
    private Long tournamentId;



    public static TeamDTO fromEntity(Team team) {
        return new TeamDTO(
            team.getTeamId(),
            team.getTeamName(),
            team.getSport() != null ? team.getSport().getSportId() : null,
            team.getSport() != null ? team.getSport().getName() : null,
            team.getCreatedBy() != null ? team.getCreatedBy().getUserId() : null,
            team.getCreatedBy() != null ? team.getCreatedBy().getName() : null,
            team.getLogo(),
            team.getTournament() != null ? team.getTournament().getTournamentId() : null
        );
    }
}