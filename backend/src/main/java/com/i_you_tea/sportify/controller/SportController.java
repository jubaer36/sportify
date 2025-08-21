package com.i_you_tea.sportify.controller;

import com.i_you_tea.sportify.dto.SportDTO;
import com.i_you_tea.sportify.entity.Sport;
import com.i_you_tea.sportify.service.SportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<List<SportDTO>> getAllSports() {
        List<Sport> sports = sportService.getAllSports();
        List<SportDTO> sportDTOs = sports.stream()
                .map(SportDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(sportDTOs);
    }
}