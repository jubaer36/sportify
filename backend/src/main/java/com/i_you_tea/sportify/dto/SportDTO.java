package com.i_you_tea.sportify.dto;

import com.i_you_tea.sportify.entity.Sport;
import com.i_you_tea.sportify.entity.Team;
import com.i_you_tea.sportify.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SportDTO {
    
    private Long sportId;
    private String name;
    private Boolean isTeamGame;
    private String rules;
    private Long captainId;
    private String captainName;
    private Long recentChampionId;
    private String recentChampionName;
    private Long recentRunnerUpId;
    private String recentRunnerUpName;
    
    public static SportDTO fromEntity(Sport sport) {
        return new SportDTO(
            sport.getSportId(),
            sport.getName(),
            sport.getIsTeamGame(),
            sport.getRules(),
            sport.getCaptain() != null ? sport.getCaptain().getUserId() : null,
            sport.getCaptain() != null ? sport.getCaptain().getName() : null,
            sport.getRecentChampion() != null ? sport.getRecentChampion().getTeamId() : null,
            sport.getRecentChampion() != null ? sport.getRecentChampion().getTeamName() : null,
            sport.getRecentRunnerUp() != null ? sport.getRecentRunnerUp().getTeamId() : null,
            sport.getRecentRunnerUp() != null ? sport.getRecentRunnerUp().getTeamName() : null
        );
    }
    
    public Sport toEntity() {
        Sport sport = new Sport();
        sport.setSportId(this.sportId);
        sport.setName(this.name);
        sport.setIsTeamGame(this.isTeamGame);
        sport.setRules(this.rules);
        if (this.captainId != null) {
            User captain = new User();
            captain.setUserId(this.captainId);
            sport.setCaptain(captain);
        }
        if (this.recentChampionId != null) {
            Team champion = new Team();
            champion.setTeamId(this.recentChampionId);
            sport.setRecentChampion(champion);
        }
        if (this.recentRunnerUpId != null) {
            Team runnerUp = new Team();
            runnerUp.setTeamId(this.recentRunnerUpId);
            sport.setRecentRunnerUp(runnerUp);
        }
        return sport;
    }
}