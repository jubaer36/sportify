package com.i_you_tea.sportify.repository;

import com.i_you_tea.sportify.entity.Tournament;
import com.i_you_tea.sportify.entity.Sport;
import com.i_you_tea.sportify.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TournamentRepository extends JpaRepository<Tournament, Long> {
    
    List<Tournament> findBySport(Sport sport);
    
    List<Tournament> findByCreatedBy(User createdBy);
    
    List<Tournament> findByStartDateBetween(LocalDate startDate, LocalDate endDate);
    
    List<Tournament> findByNameContainingIgnoreCase(String name);
    
    List<Tournament> findByChampion(com.i_you_tea.sportify.entity.Team champion);
    
    List<Tournament> findByRunnerUp(com.i_you_tea.sportify.entity.Team runnerUp);
    
    List<Tournament> findByChampionTeamId(Long championId);
    
    List<Tournament> findByRunnerUpTeamId(Long runnerUpId);
    
    @Query("SELECT DISTINCT t FROM Tournament t " +
           "JOIN Team team ON team.tournament.tournamentId = t.tournamentId " +
           "JOIN TeamMember tm ON tm.team.teamId = team.teamId " +
           "WHERE tm.user.userId = :userId")
    List<Tournament> findTournamentsByUserId(@Param("userId") Long userId);
}