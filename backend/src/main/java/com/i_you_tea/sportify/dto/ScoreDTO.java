package com.i_you_tea.sportify.dto;

import com.i_you_tea.sportify.entity.Score;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScoreDTO {
    
    private Long scoreId;
    private Long matchId;
    private String matchInfo;
    private Long teamId;
    private String teamName;
    private Integer points;
    private Long updatedById;
    private String updatedByName;
    
    public static ScoreDTO fromEntity(Score score) {
        return new ScoreDTO(
            score.getScoreId(),
            score.getMatch() != null ? score.getMatch().getMatchId() : null,
            score.getMatch() != null ? (score.getMatch().getTeam1().getTeamName() + " vs " + score.getMatch().getTeam2().getTeamName()) : null,
            score.getTeam() != null ? score.getTeam().getTeamId() : null,
            score.getTeam() != null ? score.getTeam().getTeamName() : null,
            score.getPoints(),
            score.getUpdatedBy() != null ? score.getUpdatedBy().getUserId() : null,
            score.getUpdatedBy() != null ? score.getUpdatedBy().getName() : null
        );
    }
}