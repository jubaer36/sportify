package com.i_you_tea.sportify.dto;

import com.i_you_tea.sportify.entity.Sport;
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
    
    public static SportDTO fromEntity(Sport sport) {
        return new SportDTO(
            sport.getSportId(),
            sport.getName(),
            sport.getIsTeamGame(),
            sport.getRules()
        );
    }
    
    public Sport toEntity() {
        Sport sport = new Sport();
        sport.setSportId(this.sportId);
        sport.setName(this.name);
        sport.setIsTeamGame(this.isTeamGame);
        sport.setRules(this.rules);
        return sport;
    }
}