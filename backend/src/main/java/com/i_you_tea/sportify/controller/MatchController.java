package com.i_you_tea.sportify.controller;

import com.i_you_tea.sportify.dto.MatchDTO;
import com.i_you_tea.sportify.entity.Match;
import com.i_you_tea.sportify.service.MatchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/matches")
@CrossOrigin(origins = "*")
public class MatchController {
    @Autowired
    private MatchService matchService;
    @GetMapping
    public ResponseEntity<List<MatchDTO>> getAllMatches() {
        List<Match> matches = matchService.getAllMatches();
        List<MatchDTO> matchDTOs = matches.stream()
                .map(MatchDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(matchDTOs);
    }

    @PostMapping
    public ResponseEntity<MatchDTO> createMatch(@RequestBody Match match) {
        Match created = matchService.createMatch(match);
        return ResponseEntity.status(HttpStatus.CREATED).body(MatchDTO.fromEntity(created));
    }
    
    @GetMapping("/{matchId}")
    public ResponseEntity<MatchDTO> getMatchById(@PathVariable Long matchId) {
        return matchService.getMatchById(matchId)
                .map(match -> ResponseEntity.ok(MatchDTO.fromEntity(match)))
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/round/{roundId}")
    public ResponseEntity<List<MatchDTO>> getMatchesByRoundId(@PathVariable Long roundId) {
        List<Match> matches = matchService.getMatchesByRoundId(roundId);
        List<MatchDTO> matchDTOs = matches.stream()
                .map(MatchDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(matchDTOs);
    }
    
    @GetMapping("/round-value/{roundValue}")
    public ResponseEntity<List<MatchDTO>> getMatchesByRoundValue(@PathVariable Integer roundValue) {
        List<Match> matches = matchService.getMatchesByRoundValue(roundValue);
        List<MatchDTO> matchDTOs = matches.stream()
                .map(MatchDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(matchDTOs);
    }
    
    @GetMapping("/round/{roundId}/tournament/{tournamentId}")
    public ResponseEntity<List<MatchDTO>> getMatchesByRoundAndTournament(
            @PathVariable Long roundId, 
            @PathVariable Long tournamentId) {
        List<Match> matches = matchService.getMatchesByRoundAndTournament(roundId, tournamentId);
        List<MatchDTO> matchDTOs = matches.stream()
                .map(MatchDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(matchDTOs);
    }
    
    @PutMapping("/{matchId}")
    public ResponseEntity<MatchDTO> updateMatch(@PathVariable Long matchId, @RequestBody Match matchDetails) {
        try {
            Match updated = matchService.updateMatch(matchId, matchDetails);
            return ResponseEntity.ok(MatchDTO.fromEntity(updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{matchId}")
    public ResponseEntity<Void> deleteMatch(@PathVariable Long matchId) {
        try {
            matchService.deleteMatch(matchId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Get all matches for a specific tournament
    @GetMapping("/tournament/{tournamentId}")
    public ResponseEntity<List<MatchDTO>> getMatchesByTournamentId(
            @RequestHeader("Authorization") String token,
            @PathVariable Long tournamentId) {
        // Remove Bearer prefix if necessary (like in TeamController)
//        token = token.replace("Bearer ", "");
        List<Match> matches = matchService.getMatchesByTournamentId(tournamentId);
        List<MatchDTO> matchDTOs = matches.stream()
                .map(MatchDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(matchDTOs);
    }

}