package com.i_you_tea.sportify.repository;

import com.i_you_tea.sportify.entity.Round;
import com.i_you_tea.sportify.entity.Tournament;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoundRepository extends JpaRepository<Round, Long> {
    
    /**
     * Find rounds by tournament ID
     */
    List<Round> findByTournament_TournamentId(Long tournamentId);
    
    /**
     * Find round by round value and tournament ID
     */
    Optional<Round> findByRoundValueAndTournament_TournamentId(Integer roundValue, Long tournamentId);
    
    /**
     * Find round by tournament ID and round value (alternative method name)
     */
    Optional<Round> findByTournament_TournamentIdAndRoundValue(Long tournamentId, Integer roundValue);
    
    /**
     * Check if a round value already exists for a specific tournament ID
     */
    boolean existsByRoundValueAndTournament_TournamentId(Integer roundValue, Long tournamentId);
    
    /**
     * Find rounds by tournament type
     */
    List<Round> findByType(Round.TournamentType type);
    
    /**
     * Find rounds by tournament and type
     */
    List<Round> findByTournament_TournamentIdAndType(Long tournamentId, Round.TournamentType type);
}