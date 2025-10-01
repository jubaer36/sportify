package com.i_you_tea.sportify.controller;

import com.i_you_tea.sportify.dto.RoundDTO;
import com.i_you_tea.sportify.entity.Round;
import com.i_you_tea.sportify.service.RoundService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/tournaments/{tournamentId}/rounds")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class RoundController {
    
    private final RoundService roundService;
    
    /**
     * Get all rounds for a specific tournament
     */
    @GetMapping
    public ResponseEntity<List<RoundDTO>> getAllRounds(@PathVariable Long tournamentId) {
        try {
            List<Round> rounds = roundService.getRoundsByTournamentId(tournamentId);
            List<RoundDTO> roundDTOs = rounds.stream()
                    .map(RoundDTO::fromEntity)
                    .toList();
            return ResponseEntity.ok(roundDTOs);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Get a specific round by ID
     */
    @GetMapping("/{roundId}")
    public ResponseEntity<RoundDTO> getRoundById(@PathVariable Long tournamentId, @PathVariable Long roundId) {
        try {
            Optional<Round> round = roundService.getRoundById(roundId);
            if (round.isPresent() && round.get().getTournament().getTournamentId().equals(tournamentId)) {
                return ResponseEntity.ok(RoundDTO.fromEntity(round.get()));
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Get round by round value for a specific tournament
     */
    @GetMapping("/value/{roundValue}")
    public ResponseEntity<RoundDTO> getRoundByValue(@PathVariable Long tournamentId, @PathVariable Integer roundValue) {
        try {
            Optional<Round> round = roundService.getRoundByValueAndTournament(roundValue, tournamentId);
            return round.map(r -> ResponseEntity.ok(RoundDTO.fromEntity(r)))
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Create a new round for a tournament
     */
    @PostMapping
    public ResponseEntity<?> createRound(@PathVariable Long tournamentId, @Valid @RequestBody RoundDTO roundDTO) {
        try {
            Round createdRound = roundService.createRound(roundDTO, tournamentId);
            RoundDTO responseDTO = RoundDTO.fromEntity(createdRound);
            return ResponseEntity.status(HttpStatus.CREATED).body(responseDTO);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error: Failed to create round");
        }
    }
    
    /**
     * Update an existing round
     */
    @PutMapping("/{roundId}")
    public ResponseEntity<?> updateRound(@PathVariable Long tournamentId, @PathVariable Long roundId, @Valid @RequestBody RoundDTO roundDTO) {
        try {
            // Verify the round belongs to the tournament
            Optional<Round> existingRound = roundService.getRoundById(roundId);
            if (existingRound.isEmpty() || !existingRound.get().getTournament().getTournamentId().equals(tournamentId)) {
                return ResponseEntity.notFound().build();
            }
            
            Round updatedRound = roundService.updateRound(roundId, roundDTO);
            RoundDTO responseDTO = RoundDTO.fromEntity(updatedRound);
            return ResponseEntity.ok(responseDTO);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error: Failed to update round");
        }
    }
    
    /**
     * Delete a round
     */
    @DeleteMapping("/{roundId}")
    public ResponseEntity<?> deleteRound(@PathVariable Long tournamentId, @PathVariable Long roundId) {
        try {
            // Verify the round belongs to the tournament
            Optional<Round> existingRound = roundService.getRoundById(roundId);
            if (existingRound.isEmpty() || !existingRound.get().getTournament().getTournamentId().equals(tournamentId)) {
                return ResponseEntity.notFound().build();
            }
            
            roundService.deleteRound(roundId);
            return ResponseEntity.ok().body("Round deleted successfully");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error: Failed to delete round");
        }
    }
}