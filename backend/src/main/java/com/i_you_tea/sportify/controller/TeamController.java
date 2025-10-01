package com.i_you_tea.sportify.controller;

import com.i_you_tea.sportify.dto.TeamDTO;
import com.i_you_tea.sportify.entity.Team;
import com.i_you_tea.sportify.service.TeamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/teams")
@CrossOrigin(origins = "*")
public class TeamController {
    @Autowired
    private TeamService teamService;
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('CAPTAIN') or hasRole('PLAYER')")
    public ResponseEntity<List<TeamDTO>> getAllTeams(@RequestHeader("Authorization") String token) {
        token = token.replace("Bearer ", "");
        List<Team> teams = teamService.getAllTeams();
        List<TeamDTO> teamDTOs = teams.stream()
                .map(TeamDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(teamDTOs);
    }

    @GetMapping("/tournament/{tournamentId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CAPTAIN') or hasRole('PLAYER')")
    public ResponseEntity<List<TeamDTO>> getTeamsByTournamentId(@RequestHeader("Authorization") String token,
                                                                @PathVariable Long tournamentId) {
        List<Team> teams = teamService.getTeamsByTournamentId(tournamentId);
        List<TeamDTO> teamDTOs = teams.stream()
                .map(TeamDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(teamDTOs);
    }

    @PostMapping
    public ResponseEntity<TeamDTO> createTeam(@RequestBody Team team) {
        Team created = teamService.createTeam(team);
        return ResponseEntity.status(HttpStatus.CREATED).body(TeamDTO.fromEntity(created));
    }
}