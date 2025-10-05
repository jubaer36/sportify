package com.i_you_tea.sportify.dto;

import com.i_you_tea.sportify.entity.Tournament;
import com.i_you_tea.sportify.entity.Sport;
import com.i_you_tea.sportify.entity.Team;
import com.i_you_tea.sportify.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateTournamentDTO {
    
    @NotBlank(message = "Tournament name is required")
    private String name;
    
    @NotNull(message = "Sport ID is required")
    private Long sportId;
    
    @NotNull(message = "Start date is required")
    private LocalDate startDate;
    
    @NotNull(message = "End date is required")
    private LocalDate endDate;
    
    @NotNull(message = "Created by user ID is required")
    private Long createdById;
    
    private Long championId;
    private Long runnerUpId;

    private Boolean fixtureGenerated = false;
    
    public Tournament toEntity() {
        Tournament tournament = new Tournament();
        tournament.setName(this.name);
        tournament.setStartDate(this.startDate);
        tournament.setEndDate(this.endDate);
        tournament.setFixtureGenerated(this.fixtureGenerated != null ? this.fixtureGenerated : false);
        
        
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
        
        return tournament;
    }
}