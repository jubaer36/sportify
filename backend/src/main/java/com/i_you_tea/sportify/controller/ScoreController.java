package com.i_you_tea.sportify.controller;

import com.i_you_tea.sportify.dto.ScoreDTO;
import com.i_you_tea.sportify.service.ScoreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

    @PostMapping("/createSet")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CAPTAIN') or hasRole('PLAYER')")
    public ResponseEntity<ScoreDTO> createScore(@RequestBody ScoreDTO scoreDTO) {
        ScoreDTO saved = scoreService.saveScore(scoreDTO);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{scoreId}")
    public ResponseEntity<Void> deleteScore(@PathVariable Long scoreId) {
        scoreService.deleteScore(scoreId);
        return ResponseEntity.noContent().build();
    }

    // Inside ScoreController class

    @PutMapping("/{scoreId}")
    public ResponseEntity<ScoreDTO> updateScore(
            @PathVariable Long scoreId,
            @RequestBody ScoreDTO scoreDTO
    ) {
        ScoreDTO updatedScore = scoreService.updateScore(scoreId, scoreDTO);
        return ResponseEntity.ok(updatedScore);
    }


}