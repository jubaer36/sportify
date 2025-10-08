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
    private Long teamAId;
    private Integer teamAPoints;
    private Long teamBId;
    private Integer teamBPoints;

    public static ScoreDTO fromEntity(Score score) {
        return new ScoreDTO(
            score.getScoreId(),
            score.getMatch() != null ? score.getMatch().getMatchId() : null,
            score.getTeamAId(),
            score.getTeamAPoints(),
            score.getTeamBId(),
            score.getTeamBPoints()
        );
    }

    public Score toEntity() {
        Score score = new Score();
        score.setScoreId(this.scoreId);
        // Match should be set in service using matchId
        score.setTeamAId(this.teamAId);
        score.setTeamAPoints(this.teamAPoints);
        score.setTeamBId(this.teamBId);
        score.setTeamBPoints(this.teamBPoints);
        return score;
    }
}