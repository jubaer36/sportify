package com.i_you_tea.sportify.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "scores")
public class Score {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Auto-generate scoreId if needed
    @Column(name = "score_id")
    private Long scoreId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id", nullable = false, referencedColumnName = "match_id")
    private Match match;

    @Column(name = "team_a_id", nullable = false)
    private Long teamAId;

    @Column(name = "team_a_points", nullable = false)
    private Integer teamAPoints;

    @Column(name = "team_b_id", nullable = false)
    private Long teamBId;

    @Column(name = "team_b_points", nullable = false)
    private Integer teamBPoints;
}
