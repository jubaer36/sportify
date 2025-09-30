package com.i_you_tea.sportify.controller;

import com.i_you_tea.sportify.dto.SportDTO;
import com.i_you_tea.sportify.entity.Sport;
import com.i_you_tea.sportify.service.SportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/sports")
@CrossOrigin(origins = "*")
public class SportController {
    @Autowired
    private SportService sportService;
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SportDTO>> getAllSports() {
        List<Sport> sports = sportService.getAllSports();
        List<SportDTO> sportDTOs = sports.stream()
                .map(SportDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(sportDTOs);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SportDTO> createSport(@RequestBody SportDTO sportDTO) {
        Sport created = sportService.createSport(sportDTO.toEntity());
        return ResponseEntity.status(HttpStatus.CREATED).body(SportDTO.fromEntity(created));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CAPTAIN') or hasRole('PLAYER') or hasRole('SCOREKEEPER')")
    public ResponseEntity<SportDTO> getSportById(@PathVariable Long id) {
        return sportService.getSportById(id)
                .map(sport -> ResponseEntity.ok(SportDTO.fromEntity(sport)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SportDTO> updateSport(@PathVariable Long id, @RequestBody SportDTO sportDTO) {
        Sport updated = sportService.updateSport(id, sportDTO.toEntity());
        if (updated != null) {
            return ResponseEntity.ok(SportDTO.fromEntity(updated));
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteSport(@PathVariable Long id) {
        if (sportService.deleteSport(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/captain/{captainId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CAPTAIN') or hasRole('PLAYER')")
    public ResponseEntity<List<SportDTO>> getSportsByCaptain(@PathVariable Long captainId) {
        List<Sport> sports = sportService.getSportsByCaptain(captainId);
        List<SportDTO> sportDTOs = sports.stream()
                .map(SportDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(sportDTOs);
    }
}