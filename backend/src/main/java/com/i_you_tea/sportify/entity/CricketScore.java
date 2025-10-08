
package com.i_you_tea.sportify.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "cricket_scores")
public class CricketScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "score_id")
    private Long scoreId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id", nullable = false, referencedColumnName = "match_id")
    private Match match;

    @Column(name = "team_a_id", nullable = false)
    private Long teamAId;

    @Column(name = "team_b_id", nullable = false)
    private Long teamBId;

    // Innings (e.g., 1 or 2)
    @Column(name = "team_a_innings")
    private Integer teamAInnings;

    @Column(name = "team_b_innings")
    private Integer teamBInnings;

    // Total runs
    @Column(name = "team_a_total_run")
    private Integer teamATotalRun;

    @Column(name = "team_b_total_run")
    private Integer teamBTotalRun;

    // Total wickets
    @Column(name = "team_a_total_wicket")
    private Integer teamATotalWicket;

    @Column(name = "team_b_total_wicket")
    private Integer teamBTotalWicket;

    // Overs as string (e.g., "45.3" meaning 45 overs and 3 balls) — flexible and safe.
    @Column(name = "team_a_overs", length = 20)
    private String teamAOvers;

    @Column(name = "team_b_overs", length = 20)
    private String teamBOvers;
}
