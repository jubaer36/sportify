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
}