package com.i_you_tea.sportify.controller;

import com.i_you_tea.sportify.dto.TournamentDTO;
import com.i_you_tea.sportify.dto.CreateTournamentDTO;
import com.i_you_tea.sportify.entity.Round;
import com.i_you_tea.sportify.entity.Tournament;
import com.i_you_tea.sportify.dto.TournamentDTO;
import com.i_you_tea.sportify.dto.FixtureDTO;
import com.i_you_tea.sportify.service.TournamentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@RestController
@RequestMapping("/api/tournaments")
@CrossOrigin(origins = "*")
public class TournamentController {
    @Autowired
    private TournamentService tournamentService;
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('CAPTAIN') or hasRole('PLAYER')")
    public ResponseEntity<List<TournamentDTO>> getAllTournaments() {
        List<Tournament> tournaments = tournamentService.getAllTournaments();
        List<TournamentDTO> tournamentDTOs = tournaments.stream()
                .map(TournamentDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(tournamentDTOs);
    }

    @PostMapping
    public ResponseEntity<TournamentDTO> createTournament(@RequestBody CreateTournamentDTO createTournamentDTO) {
        Tournament tournament = createTournamentDTO.toEntity();
        Tournament createdTournament = tournamentService.createTournament(tournament);
        return ResponseEntity.status(HttpStatus.CREATED).body(TournamentDTO.fromEntity(createdTournament));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TournamentDTO> getTournamentById(@PathVariable Long id) {
        return tournamentService.getTournamentById(id)
                .map(tournament -> ResponseEntity.ok(TournamentDTO.fromEntity(tournament)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<TournamentDTO> updateTournament(@PathVariable Long id, @RequestBody TournamentDTO tournamentDTO) {
        Tournament updated = tournamentService.updateTournament(id, tournamentDTO.toEntity());
        if (updated != null) {
            return ResponseEntity.ok(TournamentDTO.fromEntity(updated));
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTournament(@PathVariable Long id) {
        if (tournamentService.deleteTournament(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/sport/{sportId}")
    public ResponseEntity<List<TournamentDTO>> getTournamentsBySport(@PathVariable Long sportId) {
        List<Tournament> tournaments = tournamentService.getTournamentsBySport(sportId);
        List<TournamentDTO> tournamentDTOs = tournaments.stream()
                .map(TournamentDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(tournamentDTOs);
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CAPTAIN') or hasRole('PLAYER')")
    public ResponseEntity<List<TournamentDTO>> getTournamentsByUserId(@PathVariable Long userId) {
        List<Tournament> tournaments = tournamentService.getTournamentsByUserId(userId);
        List<TournamentDTO> tournamentDTOs = tournaments.stream()
                .map(TournamentDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(tournamentDTOs);
    }

    /**
     * Generate initial fixture structure for a tournament
     * This creates all rounds but doesn't commit to match types yet
     */
    @GetMapping("/{tournamentId}/fixture")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CAPTAIN')")
    public ResponseEntity<FixtureDTO> generateFixture(@PathVariable Long tournamentId) {
        try {
            FixtureDTO fixture = tournamentService.generateFixture(tournamentId);
            return ResponseEntity.ok(fixture);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get existing fixture with actual saved matches from database
     * Use this after matches have been generated to see the real data
     */
    @GetMapping("/{tournamentId}/fixture/existing")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CAPTAIN')")
    public ResponseEntity<FixtureDTO> getExistingFixture(@PathVariable Long tournamentId) {
        try {
            FixtureDTO fixture = tournamentService.getExistingFixture(tournamentId);
            return ResponseEntity.ok(fixture);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Select tournament type for a specific round and generate matches
     */
    @PostMapping("/rounds/{roundId}/select-type")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CAPTAIN')")
    public ResponseEntity<Void> selectRoundType(@PathVariable Long roundId,
                                                 @RequestBody RoundTypeSelection selection) {
        try {
            tournamentService.selectRoundTypeAndGenerateMatches(roundId, selection.getType());
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Check if a round is complete
     */
    @GetMapping("/rounds/{roundId}/is-complete")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CAPTAIN')")
    public ResponseEntity<Boolean> isRoundComplete(@PathVariable Long roundId) {
        try {
            boolean isComplete = tournamentService.isRoundComplete(roundId);
            return ResponseEntity.ok(isComplete);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Advance to next round after current round completes
     */
    @PostMapping("/rounds/{roundId}/advance")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CAPTAIN')")
    public ResponseEntity<Void> advanceToNextRound(@PathVariable Long roundId,
                                                    @RequestBody RoundTypeSelection selection) {
        try {
            tournamentService.advanceToNextRound(roundId, selection.getType());
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get available tournament types for selection
     */
    @GetMapping("/rounds/available-types")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CAPTAIN')")
    public ResponseEntity<List<Round.TournamentType>> getAvailableRoundTypes() {
        List<Round.TournamentType> types = tournamentService.getAvailableRoundTypes();
        return ResponseEntity.ok(types);
    }

    @PostMapping("/{tournamentId}/fixture")
    @PreAuthorize("hasRole('ADMIN')or hasRole('CAPTAIN')")
    public ResponseEntity<FixtureDTO> generateFixtureWithRoundTypes(@PathVariable Long tournamentId,
                                                                   @RequestBody List<RoundTypeRequest> roundConfigs) {
        try {
            List<TournamentService.RoundTypeConfig> configs = roundConfigs.stream()
                .map(config -> new TournamentService.RoundTypeConfig(config.getRoundValue(), config.getType()))
                .collect(Collectors.toList());

            FixtureDTO fixture = tournamentService.generateFixtureWithRoundTypes(tournamentId, configs);
            return ResponseEntity.ok(fixture);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoundTypeRequest {
        private Integer roundValue;
        private Round.TournamentType type;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoundTypeSelection {
        private Round.TournamentType type;
    }
}