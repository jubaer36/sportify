package com.i_you_tea.sportify.dto;

import com.i_you_tea.sportify.entity.Team;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

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
    private String tournamentName;
    private LocalDate tournamentStartDate;
    private LocalDate tournamentEndDate;
    private String tournamentCreatedByName;
    private Long championId;
    private String championName;
    private Long runnerUpId;
    private String runnerUpName;
    private Boolean dummy = false;


    public static TeamDTO fromEntity(Team team) {
        return new TeamDTO(
            team.getTeamId(),
            team.getTeamName(),
            team.getSport() != null ? team.getSport().getSportId() : null,
            team.getSport() != null ? team.getSport().getName() : null,
            team.getCreatedBy() != null ? team.getCreatedBy().getUserId() : null,
            team.getCreatedBy() != null ? team.getCreatedBy().getName() : null,
            team.getLogo(),
            team.getTournament() != null ? team.getTournament().getTournamentId() : null,
            team.getTournament() != null ? team.getTournament().getName() : null,
            team.getTournament() != null ? team.getTournament().getStartDate() : null,
            team.getTournament() != null ? team.getTournament().getEndDate() : null,
            team.getTournament() != null && team.getTournament().getCreatedBy() != null ? 
                team.getTournament().getCreatedBy().getName() : null,
            team.getTournament() != null && team.getTournament().getChampion() != null ? 
                team.getTournament().getChampion().getTeamId() : null,
            team.getTournament() != null && team.getTournament().getChampion() != null ? 
                team.getTournament().getChampion().getTeamName() : null,
            team.getTournament() != null && team.getTournament().getRunnerUp() != null ? 
                team.getTournament().getRunnerUp().getTeamId() : null,
            team.getTournament() != null && team.getTournament().getRunnerUp() != null ? 
                team.getTournament().getRunnerUp().getTeamName() : null,
            team.getDummy() != null ? team.getDummy() : false
        );
    }
}