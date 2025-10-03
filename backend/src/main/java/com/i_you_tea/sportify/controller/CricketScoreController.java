
package com.i_you_tea.sportify.controller;

import com.i_you_tea.sportify.dto.CricketScoreDTO;
import com.i_you_tea.sportify.service.CricketScoreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cricket-scores")
@RequiredArgsConstructor
public class CricketScoreController {

    private final CricketScoreService cricketScoreService;

    @PostMapping
    public ResponseEntity<CricketScoreDTO> create(@Valid @RequestBody CricketScoreDTO dto) {
        CricketScoreDTO created = cricketScoreService.create(dto);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<CricketScoreDTO>> getAll() {
        return ResponseEntity.ok(cricketScoreService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CricketScoreDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(cricketScoreService.findById(id));
    }

    @GetMapping("/match/{matchId}")
    public ResponseEntity<List<CricketScoreDTO>> getByMatch(@PathVariable Long matchId) {
        return ResponseEntity.ok(cricketScoreService.findByMatchId(matchId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CricketScoreDTO> update(@PathVariable Long id, @Valid @RequestBody CricketScoreDTO dto) {
        CricketScoreDTO updated = cricketScoreService.update(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        cricketScoreService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
