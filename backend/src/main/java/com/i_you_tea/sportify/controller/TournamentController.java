package com.i_you_tea.sportify.controller;

import com.i_you_tea.sportify.dto.TournamentDTO;
import com.i_you_tea.sportify.entity.Tournament;
import com.i_you_tea.sportify.service.TournamentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<List<TournamentDTO>> getAllTournaments() {
        List<Tournament> tournaments = tournamentService.getAllTournaments();
        List<TournamentDTO> tournamentDTOs = tournaments.stream()
                .map(TournamentDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(tournamentDTOs);
    }

    @PostMapping
    public ResponseEntity<TournamentDTO> createTournament(@RequestBody Tournament tournament) {
        Tournament created = tournamentService.createTournament(tournament);
        return ResponseEntity.status(HttpStatus.CREATED).body(TournamentDTO.fromEntity(created));
    }
}