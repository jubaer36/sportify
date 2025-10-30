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

import java.util.HashMap;
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

    /**
     * Get team details by ID
     * Returns comprehensive team information including sport, creator, and tournament details
     * 
     * @param token Authorization token
     * @param id Team ID
     * @return TeamDTO with all team details
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CAPTAIN') or hasRole('PLAYER')")
    public ResponseEntity<?> getTeamById(@RequestHeader("Authorization") String token,
                                        @PathVariable Long id) {
        try {
            Team team = teamService.getTeamDetailsById(id)
                    .orElseThrow(() -> new RuntimeException("Team not found with ID: " + id));
            
            TeamDTO teamDTO = TeamDTO.fromEntity(team);
            
            return ResponseEntity.ok(teamDTO);
            
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error retrieving team: " + e.getMessage()));
        }
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
    public ResponseEntity<Map<String, Object>> createDummyTeam(@RequestHeader("Authorization") String token,
                                                               @RequestBody CreateDummyTeamDTO dummyTeamDTO) {
        try {
            Team createdTeam = teamService.createDummyTeam(dummyTeamDTO);
            TeamDTO teamDTO = TeamDTO.fromEntity(createdTeam);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Dummy team created successfully");
            response.put("team", teamDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", "Failed to create dummy team: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @DeleteMapping("/dummy/round/{roundId}")
    public ResponseEntity<Void> deleteDummyTeamsByRoundId(@RequestHeader("Authorization") String token,
                                                          @PathVariable Long roundId) {
        teamService.deleteDummyTeamsByRoundId(roundId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/dummy/tournament/{tournamentId}/round/{roundValue}")
    public ResponseEntity<Void> deleteDummyTeamsByTournamentAndRound(
            @RequestHeader("Authorization") String token,
            @PathVariable Long tournamentId,
            @PathVariable int roundValue) {
        teamService.deleteDummyTeamsByTournamentIdAndRoundValue(tournamentId, roundValue);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/dummy/tournament/{tournamentId}/round/{roundValue}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CAPTAIN') or hasRole('PLAYER')")
    public ResponseEntity<Map<String, Object>> getDummyTeamsByTournamentAndRound(
            @RequestHeader("Authorization") String token,
            @PathVariable Long tournamentId,
            @PathVariable int roundValue) {
        try {
            List<Team> dummyTeams = teamService.getDummyTeamsByTournamentIdAndRoundValue(tournamentId, roundValue);
            List<TeamDTO> teamDTOs = dummyTeams.stream()
                    .map(TeamDTO::fromEntity)
                    .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Dummy teams retrieved successfully");
            response.put("teams", teamDTOs);
            response.put("totalTeams", teamDTOs.size());
            response.put("tournamentId", tournamentId);
            response.put("roundValue", roundValue);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", "Failed to retrieve dummy teams: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/dummy/tournament/{tournamentId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CAPTAIN') or hasRole('PLAYER')")
    public ResponseEntity<Map<String, Object>> getAllDummyTeamsByTournament(
            @RequestHeader("Authorization") String token,
            @PathVariable Long tournamentId) {
        try {
            List<Team> dummyTeams = teamService.getAllDummyTeamsByTournamentId(tournamentId);
            List<TeamDTO> teamDTOs = dummyTeams.stream()
                    .map(TeamDTO::fromEntity)
                    .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "All dummy teams retrieved successfully");
            response.put("teams", teamDTOs);
            response.put("totalTeams", teamDTOs.size());
            response.put("tournamentId", tournamentId);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", "Failed to retrieve dummy teams: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}