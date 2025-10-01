package com.i_you_tea.sportify.controller;

import com.i_you_tea.sportify.dto.TournamentDTO;
import com.i_you_tea.sportify.entity.Tournament;
import com.i_you_tea.sportify.service.TournamentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

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
    public ResponseEntity<TournamentDTO> createTournament(@RequestBody TournamentDTO tournamentDTO) {
        Tournament created = tournamentService.createTournament(tournamentDTO.toEntity());
        return ResponseEntity.status(HttpStatus.CREATED).body(TournamentDTO.fromEntity(created));
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
}