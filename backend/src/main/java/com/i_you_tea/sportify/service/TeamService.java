package com.i_you_tea.sportify.service;

import com.i_you_tea.sportify.dto.CreateDummyTeamDTO;
import com.i_you_tea.sportify.dto.CreateTeamDTO;
import com.i_you_tea.sportify.entity.Team;
import com.i_you_tea.sportify.entity.TeamMember;
import com.i_you_tea.sportify.entity.Sport;
import com.i_you_tea.sportify.entity.User;
import com.i_you_tea.sportify.entity.Tournament;
import com.i_you_tea.sportify.repository.TeamRepository;
import com.i_you_tea.sportify.repository.TeamMemberRepository;
import com.i_you_tea.sportify.repository.UserRepository;
import com.i_you_tea.sportify.repository.SportRepository;
import com.i_you_tea.sportify.repository.TournamentRepository;
import com.i_you_tea.sportify.repository.MatchRepository;
import com.i_you_tea.sportify.repository.MatchRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeamService {
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;
    private final SportRepository sportRepository;
    private final TournamentRepository tournamentRepository;
    private final MatchRepository matchRepository;
    public List<Team> getAllTeams() {
        return teamRepository.findAll();
    }
    public Optional<Team> getTeamById(Long id) {
        return teamRepository.findById(id);
    }
    public List<Team> getTeamsByTournamentId(Long tournamentId) {
        return teamRepository.findByTournamentTournamentId(tournamentId);
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

    public Team createTeam(CreateTeamDTO createTeamDTO) {
        // Validate that the sport exists
        Sport sport = sportRepository.findById(createTeamDTO.getSportId())
                .orElseThrow(() -> new RuntimeException("Sport not found with ID: " + createTeamDTO.getSportId()));
        
        // Validate that the user exists
        User createdBy = userRepository.findById(createTeamDTO.getCreatedById())
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + createTeamDTO.getCreatedById()));
        
        // Optional: Validate tournament if provided
        Tournament tournament = null;
        if (createTeamDTO.getTournamentId() != null) {
            tournament = tournamentRepository.findById(createTeamDTO.getTournamentId())
                    .orElseThrow(() -> new RuntimeException("Tournament not found with ID: " + createTeamDTO.getTournamentId()));
        }
        
        // Create new team entity
        Team team = new Team();
        team.setTeamName(createTeamDTO.getTeamName());
        team.setSport(sport);
        team.setCreatedBy(createdBy);
        team.setTournament(tournament);
        team.setLogo(createTeamDTO.getLogo());
        
        // Save and return the team
        return teamRepository.save(team);
    }

    public boolean deleteTeam(Long id) {
        if (teamRepository.existsById(id)) {
            teamRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public Team createDummyTeam(@Valid CreateDummyTeamDTO createDummyTeamDTO) {
        Team dummyTeam = new Team();
        dummyTeam.setTeamName(createDummyTeamDTO.getTeamName());
        dummyTeam.setDummy(true); // Mark as a dummy team

        // Assuming you have a way to get the Sport entity
        Sport sport = new Sport();
        sport.setSportId(createDummyTeamDTO.getSportId());
        dummyTeam.setSport(sport);

        // Assuming you have a way to get the Tournament entity
        Tournament tournament = new Tournament();
        tournament.setTournamentId(createDummyTeamDTO.getTournamentId());
        dummyTeam.setTournament(tournament);

        // Assuming you have a way to get the User entity for createdBy
        User createdBy = new User();
        createdBy.setUserId(createDummyTeamDTO.getCreatedById());
        dummyTeam.setCreatedBy(createdBy);

        return teamRepository.save(dummyTeam);
    }

    @Transactional
    public void deleteDummyTeamsByRoundId(Long roundId) {
        teamRepository.deleteDummyTeamsByRoundId(roundId);
    }

    @Transactional
    public void deleteDummyTeamsByTournamentIdAndRoundValue(Long tournamentId, int roundValue) {
        System.out.println("[TeamService] Deleting matches for tournament " + tournamentId + ", round " + roundValue);
        // First, delete all matches for this tournament and round
        matchRepository.deleteByTournamentIdAndRoundValue(tournamentId, roundValue);
        
        System.out.println("[TeamService] Deleting dummy teams for tournament " + tournamentId + ", round " + roundValue);
        // Then delete the dummy teams
        teamRepository.deleteDummyTeamsByTournamentIdAndRoundValue(tournamentId, roundValue);
        
        System.out.println("[TeamService] Deletion completed for tournament " + tournamentId + ", round " + roundValue);
    }
}