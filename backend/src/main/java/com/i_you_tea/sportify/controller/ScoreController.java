package com.i_you_tea.sportify.controller;

import com.i_you_tea.sportify.dto.ScoreDTO;
import com.i_you_tea.sportify.entity.Score;
import com.i_you_tea.sportify.service.ScoreService;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/scores")
@CrossOrigin(origins = "*")
public class ScoreController {
    @Autowired
    private ScoreService scoreService;
    
    @GetMapping
    public ResponseEntity<List<ScoreDTO>> getAllScores() {
        List<Score> scores = scoreService.getAllScores();
        List<ScoreDTO> scoreDTOs = scores.stream()
                .map(ScoreDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(scoreDTOs);
    }

    @PostMapping
    public ResponseEntity<ScoreDTO> createScore(@RequestBody Score score) {
        Score created = scoreService.createScore(score);
        return ResponseEntity.status(HttpStatus.CREATED).body(ScoreDTO.fromEntity(created));
    }
}