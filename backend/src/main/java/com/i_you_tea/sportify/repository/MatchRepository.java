package com.i_you_tea.sportify.repository;

import com.i_you_tea.sportify.entity.Match;
import com.i_you_tea.sportify.entity.Tournament;
import com.i_you_tea.sportify.entity.Team;
import com.i_you_tea.sportify.entity.Sport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

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
    
    List<Match> findByRound(com.i_you_tea.sportify.entity.Round round);

    List<Match> findByTournament_TournamentId(Long tournamentId);
    
    List<Match> findByRound_RoundId(Long roundId);
    
    List<Match> findByRound_RoundValue(Integer roundValue);
    
    @Query("SELECT m FROM Match m WHERE m.round.roundId = :roundId AND m.tournament.tournamentId = :tournamentId")
    List<Match> findByRoundIdAndTournamentId(@Param("roundId") Long roundId, @Param("tournamentId") Long tournamentId);
    
    /**
     * Delete all matches for a specific round
     */
    @Modifying
    @Transactional
    void deleteByRound_RoundId(Long roundId);

    /**
     * Delete matches by tournament and round value
     */
    @Modifying
    @Query("DELETE FROM Match m WHERE m.tournament.tournamentId = :tournamentId AND m.round.roundValue = :roundValue")
    void deleteByTournamentIdAndRoundValue(@Param("tournamentId") Long tournamentId, @Param("roundValue") int roundValue);
}