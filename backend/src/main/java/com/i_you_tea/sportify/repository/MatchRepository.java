package com.i_you_tea.sportify.repository;

import com.i_you_tea.sportify.entity.Match;
import com.i_you_tea.sportify.entity.Tournament;
import com.i_you_tea.sportify.entity.Team;
import com.i_you_tea.sportify.entity.Sport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MatchRepository extends JpaRepository<Match, Long> {
    
    List<Match> findByTournament(Tournament tournament);
    
    List<Match> findBySport(Sport sport);
    
    List<Match> findByStatus(Match.MatchStatus status);
    
    @Query("SELECT m FROM Match m WHERE m.team1 = :team OR m.team2 = :team")
    List<Match> findByTeam(@Param("team") Team team);
    
    List<Match> findByScheduledTimeBetween(LocalDateTime start, LocalDateTime end);
    
    List<Match> findByWinnerTeam(Team winnerTeam);
}