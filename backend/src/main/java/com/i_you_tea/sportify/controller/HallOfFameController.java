package com.i_you_tea.sportify.controller;

import com.i_you_tea.sportify.dto.HallOfFameDTO;
import com.i_you_tea.sportify.entity.HallOfFame;
import com.i_you_tea.sportify.service.HallOfFameService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/hall-of-fame")
@CrossOrigin(origins = "*")
public class HallOfFameController {
    @Autowired
    private HallOfFameService hallOfFameService;
    
    @GetMapping
    public ResponseEntity<List<HallOfFameDTO>> getAllHallOfFameEntries() {
        List<HallOfFame> hallOfFameEntries = hallOfFameService.getAllHallOfFameEntries();
        List<HallOfFameDTO> hallOfFameDTOs = hallOfFameEntries.stream()
                .map(HallOfFameDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(hallOfFameDTOs);
    }

    @PostMapping
    public ResponseEntity<HallOfFameDTO> createHallOfFame(@RequestBody HallOfFame hallOfFame) {
        HallOfFame created = hallOfFameService.createHallOfFame(hallOfFame);
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED).body(HallOfFameDTO.fromEntity(created));
    }
}