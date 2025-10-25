package com.i_you_tea.sportify.service;

import com.i_you_tea.sportify.dto.AddTeamMemberDTO;
import com.i_you_tea.sportify.dto.UpdateTeamMemberStatusDTO;
import com.i_you_tea.sportify.entity.Team;
import com.i_you_tea.sportify.entity.TeamMember;
import com.i_you_tea.sportify.entity.User;
import com.i_you_tea.sportify.repository.TeamMemberRepository;
import com.i_you_tea.sportify.repository.TeamRepository;
import com.i_you_tea.sportify.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TeamMemberService {
    
    private final TeamMemberRepository teamMemberRepository;
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    
    @Transactional
    public TeamMember addTeamMember(AddTeamMemberDTO addTeamMemberDTO) {
        // Validate that the team exists
        Team team = teamRepository.findById(addTeamMemberDTO.getTeamId())
                .orElseThrow(() -> new RuntimeException("Team not found with ID: " + addTeamMemberDTO.getTeamId()));
        
        // Validate that the user exists
        User user = userRepository.findById(addTeamMemberDTO.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + addTeamMemberDTO.getUserId()));
        
        // Check if the user is already a member of the team
        if (teamMemberRepository.existsByTeamAndUser(team, user)) {
            throw new RuntimeException("User is already a member of this team");
        }
        
        // Create new team member
        TeamMember teamMember = new TeamMember();
        teamMember.setTeam(team);
        teamMember.setUser(user);
        teamMember.setRoleInTeam(addTeamMemberDTO.getRoleInTeam());
        teamMember.setStatus(TeamMember.TeamMemberStatus.ACCEPTED);
        
        return teamMemberRepository.save(teamMember);
    }
    
    @Transactional
    public TeamMember updateTeamMemberStatus(UpdateTeamMemberStatusDTO updateStatusDTO) {
        // Validate that the team exists
        teamRepository.findById(updateStatusDTO.getTeamId())
                .orElseThrow(() -> new RuntimeException("Team not found with ID: " + updateStatusDTO.getTeamId()));
        
        // Validate that the user exists
        userRepository.findById(updateStatusDTO.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + updateStatusDTO.getUserId()));
        
        // Find the team member
        TeamMember.TeamMemberId teamMemberId = new TeamMember.TeamMemberId(
                updateStatusDTO.getTeamId(), 
                updateStatusDTO.getUserId()
        );
        
        TeamMember teamMember = teamMemberRepository.findById(teamMemberId)
                .orElseThrow(() -> new RuntimeException("Team member not found"));
        
        // Update the status
        teamMember.setStatus(updateStatusDTO.getStatus());
        
        return teamMemberRepository.save(teamMember);
    }
    
    @Transactional
    public void removeTeamMember(Long teamId, Long userId) {
        // Validate that the team exists
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found with ID: " + teamId));
        
        // Validate that the user exists
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
        
        // Check if the team member exists
        if (!teamMemberRepository.existsByTeamAndUser(team, user)) {
            throw new RuntimeException("User is not a member of this team");
        }
        
        // Create the composite key and delete
        TeamMember.TeamMemberId teamMemberId = new TeamMember.TeamMemberId(teamId, userId);
        teamMemberRepository.deleteById(teamMemberId);
    }
    
    public List<TeamMember> getTeamMembers(Long teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found with ID: " + teamId));
        
        return teamMemberRepository.findByTeam(team);
    }
    
    public List<TeamMember> getUserTeamMemberships(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
        
        return teamMemberRepository.findByUser(user);
    }
    
    public Optional<TeamMember> getTeamMember(Long teamId, Long userId) {
        TeamMember.TeamMemberId teamMemberId = new TeamMember.TeamMemberId(teamId, userId);
        return teamMemberRepository.findById(teamMemberId);
    }
}