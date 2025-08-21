package com.i_you_tea.sportify.repository;

import com.i_you_tea.sportify.entity.Score;
import com.i_you_tea.sportify.entity.Match;
import com.i_you_tea.sportify.entity.Team;
import com.i_you_tea.sportify.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScoreRepository extends JpaRepository<Score, Long> {
    
    List<Score> findByMatch(Match match);
    
    List<Score> findByTeam(Team team);
    
    List<Score> findByUpdatedBy(User updatedBy);
    
    List<Score> findByMatchAndTeam(Match match, Team team);
}