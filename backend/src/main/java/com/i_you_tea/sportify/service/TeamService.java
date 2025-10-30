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

    /**
     * Get detailed team information by ID including related entities
     * @param id The team ID
     * @return Team with populated sport, creator, and tournament details
     */
    public Optional<Team> getTeamDetailsById(Long id) {
        return teamRepository.findByIdWithDetails(id);
    }

    /**
     * Get comprehensive team information including members
     * @param id The team ID
     * @return Team with all related information
     */
    public Optional<Team> getCompleteTeamDetailsById(Long id) {
        Optional<Team> teamOptional = teamRepository.findByIdWithDetails(id);
        if (teamOptional.isPresent()) {
            Team team = teamOptional.get();
            // The team members are already accessible through the team entity
            // if needed, we could add additional processing here
            return Optional.of(team);
        }
        return Optional.empty();
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

        // Load the actual Sport entity from database
        Sport sport = sportRepository.findById(createDummyTeamDTO.getSportId())
                .orElseThrow(() -> new RuntimeException("Sport not found with ID: " + createDummyTeamDTO.getSportId()));
        dummyTeam.setSport(sport);

        // Load the actual Tournament entity from database
        Tournament tournament = tournamentRepository.findById(createDummyTeamDTO.getTournamentId())
                .orElseThrow(() -> new RuntimeException("Tournament not found with ID: " + createDummyTeamDTO.getTournamentId()));
        dummyTeam.setTournament(tournament);

        // Load the actual User entity from database
        User createdBy = userRepository.findById(createDummyTeamDTO.getCreatedById())
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + createDummyTeamDTO.getCreatedById()));
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
        String roundPattern = "Round " + roundValue;
        teamRepository.deleteDummyTeamsByTournamentIdAndRoundValue(tournamentId, roundPattern);
        
        System.out.println("[TeamService] Deletion completed for tournament " + tournamentId + ", round " + roundValue);
    }

    public List<Team> getDummyTeamsByTournamentIdAndRoundValue(Long tournamentId, int roundValue) {
        System.out.println("[TeamService] Fetching dummy teams for tournament " + tournamentId + ", round " + roundValue);
        String roundPattern = "Round " + roundValue;
        List<Team> dummyTeams = teamRepository.findDummyTeamsByTournamentIdAndRoundValue(tournamentId, roundPattern);
        System.out.println("[TeamService] Found " + dummyTeams.size() + " dummy teams for tournament " + tournamentId + ", round " + roundValue);
        return dummyTeams;
    }

    public List<Team> getAllDummyTeamsByTournamentId(Long tournamentId) {
        System.out.println("[TeamService] Fetching all dummy teams for tournament " + tournamentId);
        List<Team> dummyTeams = teamRepository.findAllDummyTeamsByTournamentId(tournamentId);
        System.out.println("[TeamService] Found " + dummyTeams.size() + " dummy teams for tournament " + tournamentId);
        return dummyTeams;
    }
}