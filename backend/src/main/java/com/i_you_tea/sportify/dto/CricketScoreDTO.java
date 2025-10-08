package com.i_you_tea.sportify.dto;

import com.i_you_tea.sportify.entity.CricketScore;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CricketScoreDTO {
    private Long scoreId;
    private Long matchId;
    private Long teamAId;
    private Long teamBId;

    private Integer teamAInnings;
    private Integer teamBInnings;

    private Integer teamATotalRun;
    private Integer teamBTotalRun;

    private Integer teamATotalWicket;
    private Integer teamBTotalWicket;

    private String teamAOvers;
    private String teamBOvers;

    // ---- Mapping ----
    public static CricketScoreDTO fromEntity(CricketScore entity) {
        return new CricketScoreDTO(
            entity.getScoreId(),
            entity.getMatch() != null ? entity.getMatch().getMatchId() : null,
            entity.getTeamAId(),
            entity.getTeamBId(),
            entity.getTeamAInnings(),
            entity.getTeamBInnings(),
            entity.getTeamATotalRun(),
            entity.getTeamBTotalRun(),
            entity.getTeamATotalWicket(),
            entity.getTeamBTotalWicket(),
            entity.getTeamAOvers(),
            entity.getTeamBOvers()
        );
    }

    public CricketScore toEntity() {
        CricketScore cs = new CricketScore();
        cs.setScoreId(this.scoreId);
        // Match will be set in service via matchId lookup
        cs.setTeamAId(this.teamAId);
        cs.setTeamBId(this.teamBId);
        cs.setTeamAInnings(this.teamAInnings);
        cs.setTeamBInnings(this.teamBInnings);
        cs.setTeamATotalRun(this.teamATotalRun);
        cs.setTeamBTotalRun(this.teamBTotalRun);
        cs.setTeamATotalWicket(this.teamATotalWicket);
        cs.setTeamBTotalWicket(this.teamBTotalWicket);
        cs.setTeamAOvers(this.teamAOvers);
        cs.setTeamBOvers(this.teamBOvers);
        return cs;
    }
}
