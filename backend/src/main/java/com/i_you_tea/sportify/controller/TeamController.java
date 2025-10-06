package com.i_you_tea.sportify.controller;

import com.i_you_tea.sportify.dto.*;
import com.i_you_tea.sportify.dto.CreateTeamDTO;
import com.i_you_tea.sportify.entity.Team;
import com.i_you_tea.sportify.service.TeamService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
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

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CAPTAIN') or hasRole('PLAYER')")
    public ResponseEntity<?> deleteTeam(@RequestHeader("Authorization") String token,
                                        @PathVariable Long id) {
        try {
            boolean deleted = teamService.deleteTeam(id);
            if (deleted) {
                return ResponseEntity.ok(Map.of("message", "Team deleted successfully"));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Team not found"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error deleting team: " + e.getMessage()));
        }
    }

    @PostMapping("/user-teams")
    public ResponseEntity<?> getUserTeams(@RequestBody UserTeamsRequestDTO request) {
        try {
            if (request.getUserId() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "User ID is required"));
            }

            List<Team> teams = teamService.getTeamsByUserId(request.getUserId());
            
            if (teams.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                    "message", "No teams found for this user",
                    "teams", List.of()
                ));
            }

            List<TeamDTO> teamDTOs = teams.stream()
                    .map(TeamDTO::fromEntity)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(Map.of(
                "message", "Teams retrieved successfully",
                "teams", teamDTOs,
                "totalTeams", teamDTOs.size()
            ));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error retrieving user teams: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createTeam(@RequestHeader("Authorization") String token,
                                        @Valid @RequestBody CreateTeamDTO createTeamDTO) {
        try {
            Team createdTeam = teamService.createTeam(createTeamDTO);
            TeamDTO teamDTO = TeamDTO.fromEntity(createdTeam);
            
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of(
                        "message", "Team created successfully",
                        "team", teamDTO
                    ));
                    
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error creating team: " + e.getMessage()));
        }
    }

    @PostMapping("/dummy")
    @PreAuthorize("hasRole('CAPTAIN')")
    public ResponseEntity<?> createDummyTeam(@RequestHeader("Authorization") String token,
                                             @Valid @RequestBody CreateDummyTeamDTO createDummyTeamDTO) {
        try {
            Team team = teamService.createDummyTeam(createDummyTeamDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(TeamDTO.fromEntity(team));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error creating dummy team: " + e.getMessage()));
        }
    }
}