
package com.i_you_tea.sportify.repository;

import com.i_you_tea.sportify.entity.CricketScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CricketScoreRepository extends JpaRepository<CricketScore, Long> {
    // Find cricket scores by match ID
    List<CricketScore> findByMatchId(Long matchId);
}
