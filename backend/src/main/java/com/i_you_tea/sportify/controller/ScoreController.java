package com.i_you_tea.sportify.controller;

import com.i_you_tea.sportify.dto.ScoreDTO;
import com.i_you_tea.sportify.service.ScoreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/scores")
public class ScoreController {

    @Autowired
    private ScoreService scoreService;

    @GetMapping("/match/{matchId}")
    public ResponseEntity<List<ScoreDTO>> getScoresByMatch(@PathVariable Long matchId) {
        List<ScoreDTO> scores = scoreService.getScoresByMatch(matchId);
        return ResponseEntity.ok(scores);
    }

    @PostMapping
    public ResponseEntity<ScoreDTO> createScore(@RequestBody ScoreDTO scoreDTO) {
        ScoreDTO saved = scoreService.saveScore(scoreDTO);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{scoreId}")
    public ResponseEntity<Void> deleteScore(@PathVariable Long scoreId) {
        scoreService.deleteScore(scoreId);
        return ResponseEntity.noContent().build();
    }
}