package com.i_you_tea.sportify.service;

import com.i_you_tea.sportify.entity.Team;
import com.i_you_tea.sportify.entity.TeamMember;
import com.i_you_tea.sportify.entity.Sport;
import com.i_you_tea.sportify.entity.User;
import com.i_you_tea.sportify.repository.TeamRepository;
import com.i_you_tea.sportify.repository.TeamMemberRepository;
import com.i_you_tea.sportify.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeamService {
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;
    public List<Team> getAllTeams() {
        return teamRepository.findAll();
    }

    public Team createTeam(Team team) {
        return teamRepository.save(team);
    }

    public List<Team> getTeamsByUserId(Long userId) {
        // Find user by ID
        Optional<User> userOptional = userRepository.findById(userId);
        if (userOptional.isEmpty()) {
            return List.of(); // Return empty list if user not found
        }
        
        User user = userOptional.get();
        
        // Find all team memberships for the user
        List<TeamMember> teamMembers = teamMemberRepository.findByUser(user);
        
        // Extract teams from team memberships
        return teamMembers.stream()
                .map(TeamMember::getTeam)
                .collect(Collectors.toList());
    }
}