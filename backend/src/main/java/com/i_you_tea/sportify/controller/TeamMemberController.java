package com.i_you_tea.sportify.controller;

import com.i_you_tea.sportify.dto.AddTeamMemberDTO;
import com.i_you_tea.sportify.dto.TeamMemberDTO;
import com.i_you_tea.sportify.dto.UpdateTeamMemberStatusDTO;
import com.i_you_tea.sportify.entity.TeamMember;
import com.i_you_tea.sportify.service.TeamMemberService;
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
@RequestMapping("/api/team-members")
@CrossOrigin(origins = "*")
public class TeamMemberController {
    
    @Autowired
    private TeamMemberService teamMemberService;
    
    // Add a new team member
    @PostMapping
    public ResponseEntity<?> addTeamMember(@RequestHeader("Authorization") String token,
                                           @Valid @RequestBody AddTeamMemberDTO addTeamMemberDTO) {
        try {
            TeamMember teamMember = teamMemberService.addTeamMember(addTeamMemberDTO);
            TeamMemberDTO teamMemberDTO = TeamMemberDTO.fromEntity(teamMember);
            
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of(
                        "message", "Team member added successfully",
                        "teamMember", teamMemberDTO
                    ));
                    
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error adding team member: " + e.getMessage()));
        }
    }
    
    // Update team member status
    @PutMapping("/status")
    public ResponseEntity<?> updateTeamMemberStatus(@RequestHeader("Authorization") String token,
                                                    @Valid @RequestBody UpdateTeamMemberStatusDTO updateStatusDTO) {
        try {
            TeamMember teamMember = teamMemberService.updateTeamMemberStatus(updateStatusDTO);
            TeamMemberDTO teamMemberDTO = TeamMemberDTO.fromEntity(teamMember);
            
            return ResponseEntity.ok(Map.of(
                "message", "Team member status updated successfully",
                "teamMember", teamMemberDTO
            ));
            
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error updating team member status: " + e.getMessage()));
        }
    }
    
    // Remove a team member
    @DeleteMapping("/team/{teamId}/user/{userId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CAPTAIN')")
    public ResponseEntity<?> removeTeamMember(@RequestHeader("Authorization") String token,
                                              @PathVariable Long teamId,
                                              @PathVariable Long userId) {
        try {
            teamMemberService.removeTeamMember(teamId, userId);
            
            return ResponseEntity.ok(Map.of(
                "message", "Team member removed successfully"
            ));
            
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error removing team member: " + e.getMessage()));
        }
    }
    
    // Get all members of a team
    @GetMapping("/team/{teamId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CAPTAIN') or hasRole('PLAYER')")
    public ResponseEntity<?> getTeamMembers(@RequestHeader("Authorization") String token,
                                            @PathVariable Long teamId) {
        try {
            List<TeamMember> teamMembers = teamMemberService.getTeamMembers(teamId);
            List<TeamMemberDTO> teamMemberDTOs = teamMembers.stream()
                    .map(TeamMemberDTO::fromEntity)
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(Map.of(
                "message", "Team members retrieved successfully",
                "teamMembers", teamMemberDTOs,
                "totalMembers", teamMemberDTOs.size()
            ));
            
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error retrieving team members: " + e.getMessage()));
        }
    }
    
    // Get all team memberships for a user
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CAPTAIN') or hasRole('PLAYER')")
    public ResponseEntity<?> getUserTeamMemberships(@RequestHeader("Authorization") String token,
                                                    @PathVariable Long userId) {
        try {
            List<TeamMember> teamMemberships = teamMemberService.getUserTeamMemberships(userId);
            List<TeamMemberDTO> teamMemberDTOs = teamMemberships.stream()
                    .map(TeamMemberDTO::fromEntity)
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(Map.of(
                "message", "User team memberships retrieved successfully",
                "teamMemberships", teamMemberDTOs,
                "totalMemberships", teamMemberDTOs.size()
            ));
            
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error retrieving user team memberships: " + e.getMessage()));
        }
    }
    
    // Get a specific team member
    @GetMapping("/team/{teamId}/user/{userId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CAPTAIN') or hasRole('PLAYER')")
    public ResponseEntity<?> getTeamMember(@RequestHeader("Authorization") String token,
                                           @PathVariable Long teamId,
                                           @PathVariable Long userId) {
        try {
            return teamMemberService.getTeamMember(teamId, userId)
                    .map(teamMember -> {
                        TeamMemberDTO teamMemberDTO = TeamMemberDTO.fromEntity(teamMember);
                        return ResponseEntity.ok(Map.of(
                            "message", "Team member retrieved successfully",
                            "teamMember", teamMemberDTO
                        ));
                    })
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(Map.of("error", "Team member not found")));
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error retrieving team member: " + e.getMessage()));
        }
    }
}
