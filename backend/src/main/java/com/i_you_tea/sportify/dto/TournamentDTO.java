package com.i_you_tea.sportify.dto;

import com.i_you_tea.sportify.entity.Tournament;
import com.i_you_tea.sportify.entity.Sport;
import com.i_you_tea.sportify.entity.Team;
import com.i_you_tea.sportify.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TournamentDTO {
    
    private Long tournamentId;
    private String name;
    private Long sportId;
    private String sportName;
    private LocalDate startDate;
    private LocalDate endDate;
    private Long createdById;
    private String createdByName;
    private Long championId;
    private String championName;
    private Long runnerUpId;
    private String runnerUpName;
    private Boolean fixtureGenerated;


    public static TournamentDTO fromEntity(Tournament tournament) {
        return new TournamentDTO(
            tournament.getTournamentId(),
            tournament.getName(),
            tournament.getSport() != null ? tournament.getSport().getSportId() : null,
            tournament.getSport() != null ? tournament.getSport().getName() : null,
            tournament.getStartDate(),
            tournament.getEndDate(),
            tournament.getCreatedBy() != null ? tournament.getCreatedBy().getUserId() : null,
            tournament.getCreatedBy() != null ? tournament.getCreatedBy().getName() : null,
            tournament.getChampion() != null ? tournament.getChampion().getTeamId() : null,
            tournament.getChampion() != null ? tournament.getChampion().getTeamName() : null,
            tournament.getRunnerUp() != null ? tournament.getRunnerUp().getTeamId() : null,
            tournament.getRunnerUp() != null ? tournament.getRunnerUp().getTeamName() : null,
                tournament.getFixtureGenerated() != null ? tournament.getFixtureGenerated() : false
        );
    }
    
    public Tournament toEntity() {
        Tournament tournament = new Tournament();      
        tournament.setTournamentId(this.tournamentId);       
        tournament.setName(this.name);       
        tournament.setStartDate(this.startDate);       
        tournament.setEndDate(this.endDate);       
        if (this.sportId != null) {           
            Sport sport = new Sport();            
            sport.setSportId(this.sportId);            
            tournament.setSport(sport);        
        }       
        if (this.createdById != null) {
            User createdBy = new User();            
            createdBy.setUserId(this.createdById);           
            tournament.setCreatedBy(createdBy);        
        }        
        if (this.championId != null) {            
            Team champion = new Team();           
            champion.setTeamId(this.championId);           
            tournament.setChampion(champion);        
        }        
        if (this.runnerUpId != null) {            
            Team runnerUp = new Team();            
            runnerUp.setTeamId(this.runnerUpId);            
            tournament.setRunnerUp(runnerUp);        
        }
        tournament.setFixtureGenerated(this.fixtureGenerated != null ? this.fixtureGenerated : false);
        return tournament;
    }
}