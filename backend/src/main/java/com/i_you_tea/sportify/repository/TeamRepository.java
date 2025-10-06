package com.i_you_tea.sportify.repository;

import com.i_you_tea.sportify.entity.Team;
import com.i_you_tea.sportify.entity.Sport;
import com.i_you_tea.sportify.entity.User;
import com.i_you_tea.sportify.entity.Tournament;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {
    
    List<Team> findBySport(Sport sport);
    
    List<Team> findByCreatedBy(User createdBy);
    
    List<Team> findByTeamNameContainingIgnoreCase(String teamName);

    List<Team> findByTournamentTournamentId(Long tournamentId);
    
    List<Team> findByTournament(Tournament tournament);
    
    List<Team> findByTournamentIsNull();
    
    List<Team> findByTournamentIsNotNull();

    void deleteByTournamentTournamentIdAndDummy(Long tournamentId, boolean dummy);

    @Modifying
    @Query("DELETE FROM Team t WHERE t.dummy = true AND t.teamId IN " +
           "(SELECT DISTINCT m.team1.teamId FROM Match m WHERE m.round.roundId = :roundId " +
           "UNION SELECT DISTINCT m.team2.teamId FROM Match m WHERE m.round.roundId = :roundId)")
    void deleteDummyTeamsByRoundId(@Param("roundId") Long roundId);

    @Modifying
    @Query("DELETE FROM Team t WHERE t.dummy = true AND t.tournament.tournamentId = :tournamentId AND t.teamId IN " +
           "(SELECT DISTINCT m.team1.teamId FROM Match m WHERE m.round.roundValue = :roundValue AND m.tournament.tournamentId = :tournamentId " +
           "UNION SELECT DISTINCT m.team2.teamId FROM Match m WHERE m.round.roundValue = :roundValue AND m.tournament.tournamentId = :tournamentId)")
    void deleteDummyTeamsByTournamentIdAndRoundValue(@Param("tournamentId") Long tournamentId, @Param("roundValue") int roundValue);
}