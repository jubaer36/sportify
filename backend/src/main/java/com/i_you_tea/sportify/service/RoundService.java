package com.i_you_tea.sportify.service;

import com.i_you_tea.sportify.dto.RoundDTO;
import com.i_you_tea.sportify.entity.Round;
import com.i_you_tea.sportify.entity.Tournament;
import com.i_you_tea.sportify.repository.RoundRepository;
import com.i_you_tea.sportify.repository.TournamentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class RoundService {
    
    private final RoundRepository roundRepository;
    private final TournamentRepository tournamentRepository;
    
    /**
     * Get all rounds
     */
    public List<Round> getAllRounds() {
        return roundRepository.findAll();
    }
    
    /**
     * Get round by ID
     */
    public Optional<Round> getRoundById(Long roundId) {
        return roundRepository.findById(roundId);
    }
    
    /**
     * Get rounds by tournament ID
     */
    public List<Round> getRoundsByTournamentId(Long tournamentId) {
        return roundRepository.findByTournament_TournamentId(tournamentId);
    }
    
    /**
     * Get round by round value and tournament ID
     */
    public Optional<Round> getRoundByValueAndTournament(Integer roundValue, Long tournamentId) {
        return roundRepository.findByRoundValueAndTournament_TournamentId(roundValue, tournamentId);
    }
    
    /**
     * Create a new round for a tournament
     */
    public Round createRound(RoundDTO roundDTO, Long tournamentId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new IllegalArgumentException("Tournament not found with id: " + tournamentId));
        
        // Check if round value already exists for this tournament
        if (roundRepository.existsByRoundValueAndTournament_TournamentId(roundDTO.getRoundValue(), tournamentId)) {
            throw new IllegalArgumentException("Round with value " + roundDTO.getRoundValue() + " already exists for this tournament");
        }
        
        Round round = new Round();
        round.setRoundValue(roundDTO.getRoundValue());
        round.setRoundName(roundDTO.getRoundName());
        round.setTournament(tournament);
        
        return roundRepository.save(round);
    }
    
    /**
     * Update an existing round
     */
    public Round updateRound(Long roundId, RoundDTO roundDTO) {
        Round existingRound = roundRepository.findById(roundId)
                .orElseThrow(() -> new IllegalArgumentException("Round not found with id: " + roundId));
        
        existingRound.setRoundValue(roundDTO.getRoundValue());
        existingRound.setRoundName(roundDTO.getRoundName());
        
        return roundRepository.save(existingRound);
    }
    
    /**
     * Delete a round
     */
    public void deleteRound(Long roundId) {
        if (!roundRepository.existsById(roundId)) {
            throw new IllegalArgumentException("Round not found with id: " + roundId);
        }
        roundRepository.deleteById(roundId);
    }
}