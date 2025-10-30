package com.i_you_tea.sportify.dto;

import com.i_you_tea.sportify.entity.CricketScore;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CricketScoreDTO {
    private Long cricketScoreId;
    private Long matchId;
    private Long teamId;
    private Integer runs;
    private Integer wickets;
    private Double overs;

    // ---- Mapping ----
    public static CricketScoreDTO fromEntity(CricketScore entity) {
        return new CricketScoreDTO(
            entity.getCricketScoreId(),
            entity.getMatchId(),
            entity.getTeamId(),
            entity.getRuns(),
            entity.getWickets(),
            entity.getOvers()
        );
    }

    public CricketScore toEntity() {
        CricketScore cs = new CricketScore();
        cs.setCricketScoreId(this.cricketScoreId);
        cs.setMatchId(this.matchId);
        cs.setTeamId(this.teamId);
        cs.setRuns(this.runs);
        cs.setWickets(this.wickets);
        cs.setOvers(this.overs);
        return cs;
    }
}
