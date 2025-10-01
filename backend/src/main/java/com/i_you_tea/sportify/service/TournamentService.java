package com.i_you_tea.sportify.service;

import com.i_you_tea.sportify.entity.Round;
import com.i_you_tea.sportify.entity.Round;
import com.i_you_tea.sportify.repository.MatchRepository;
import com.i_you_tea.sportify.repository.RoundRepository;
import com.i_you_tea.sportify.entity.Tournament;
import com.i_you_tea.sportify.entity.Sport;
import com.i_you_tea.sportify.entity.Team;
import com.i_you_tea.sportify.entity.User;
import com.i_you_tea.sportify.repository.TournamentRepository;
import com.i_you_tea.sportify.repository.TeamRepository;
import com.i_you_tea.sportify.repository.SportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import lombok.Data;
import lombok.AllArgsConstructor;

@Service
@RequiredArgsConstructor
public class TournamentService {
    private final TournamentRepository tournamentRepository;
    private final TeamRepository teamRepository;
    private final SportRepository sportRepository;
    private final RoundRepository roundRepository;
    private final MatchRepository matchRepository;
    private final MatchRepository matchRepository;
    private final RoundRepository roundRepository;
    
    public List<Tournament> getAllTournaments() {
        return tournamentRepository.findAll();
    }

    public Tournament createTournament(Tournament tournament) {
        // Validate champion and runner-up if provided
        if (tournament.getChampion() != null && tournament.getChampion().getTeamId() != null) {
            Optional<Team> championTeam = teamRepository.findById(tournament.getChampion().getTeamId());
            if (championTeam.isPresent()) {
                tournament.setChampion(championTeam.get());
            } else {
                tournament.setChampion(null);
            }
        }
        
        if (tournament.getRunnerUp() != null && tournament.getRunnerUp().getTeamId() != null) {
            Optional<Team> runnerUpTeam = teamRepository.findById(tournament.getRunnerUp().getTeamId());
            if (runnerUpTeam.isPresent()) {
                tournament.setRunnerUp(runnerUpTeam.get());
            } else {
                tournament.setRunnerUp(null);
            }
        }
        
        Tournament savedTournament = tournamentRepository.save(tournament);
        
        // Update sport's recent champion and runner-up if this tournament has results
        if (savedTournament.getChampion() != null && savedTournament.getSport() != null) {
            updateSportRecentResults(savedTournament);
        }
        
        return savedTournament;
    }
    
    public Optional<Tournament> getTournamentById(Long id) {
        return tournamentRepository.findById(id);
    }
    
    public Tournament updateTournament(Long id, Tournament tournamentUpdate) {
        Optional<Tournament> existingTournament = tournamentRepository.findById(id);
        if (existingTournament.isPresent()) {
            Tournament tournament = existingTournament.get();
            tournament.setName(tournamentUpdate.getName());
            tournament.setStartDate(tournamentUpdate.getStartDate());
            tournament.setEndDate(tournamentUpdate.getEndDate());
            
            // Handle champion and runner-up updates
            if (tournamentUpdate.getChampion() != null && tournamentUpdate.getChampion().getTeamId() != null) {
                Optional<Team> championTeam = teamRepository.findById(tournamentUpdate.getChampion().getTeamId());
                if (championTeam.isPresent()) {
                    tournament.setChampion(championTeam.get());
                } else {
                    tournament.setChampion(null);
                }
            } else {
                tournament.setChampion(null);
            }
            
            if (tournamentUpdate.getRunnerUp() != null && tournamentUpdate.getRunnerUp().getTeamId() != null) {
                Optional<Team> runnerUpTeam = teamRepository.findById(tournamentUpdate.getRunnerUp().getTeamId());
                if (runnerUpTeam.isPresent()) {
                    tournament.setRunnerUp(runnerUpTeam.get());
                } else {
                    tournament.setRunnerUp(null);
                }
            } else {
                tournament.setRunnerUp(null);
            }
            
            Tournament savedTournament = tournamentRepository.save(tournament);
            
            // Update sport's recent results if championship info changed
            if (savedTournament.getChampion() != null && savedTournament.getSport() != null) {
                updateSportRecentResults(savedTournament);
            }
            
            return savedTournament;
        }
        return null;
    }
    
    public List<Tournament> getTournamentsBySport(Long sportId) {
        Sport sport = new Sport();
        sport.setSportId(sportId);
        return tournamentRepository.findBySport(sport);
    }
    
    public boolean deleteTournament(Long id) {
        if (tournamentRepository.existsById(id)) {
            tournamentRepository.deleteById(id);
            return true;
        }
        return false;
    }
    
    public List<Tournament> getTournamentsByUserId(Long userId) {
        return tournamentRepository.findTournamentsByUserId(userId);
    }
    
    private void updateSportRecentResults(Tournament tournament) {
        Optional<Sport> sportOpt = sportRepository.findById(tournament.getSport().getSportId());
        if (sportOpt.isPresent()) {
            Sport sport = sportOpt.get();
            sport.setRecentChampion(tournament.getChampion());
            sport.setRecentRunnerUp(tournament.getRunnerUp());
            sportRepository.save(sport);
        }
    }

    /**
     * Generate fixture for a tournament based on rounds
     * Higher round values = earlier rounds, Lower round values = later rounds
     * Round 1 = Final, Round 2 = Semi-final, etc.
     */
    public FixtureDTO generateFixture(Long tournamentId) {
        // Get tournament
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new IllegalArgumentException("Tournament not found with id: " + tournamentId));

        // Get participating teams
        List<Team> participatingTeams = teamRepository.findByTournamentTournamentId(tournamentId);
        if (participatingTeams.isEmpty()) {
            throw new IllegalArgumentException("No participating teams found for tournament: " + tournamentId);
        }

        // Calculate number of rounds needed (log2 of number of teams)
        int numRounds = (int) Math.ceil(Math.log(participatingTeams.size()) / Math.log(2));

        FixtureDTO fixture = new FixtureDTO();
        fixture.setTournamentId(tournament.getTournamentId());
        fixture.setTournamentName(tournament.getName());
        fixture.setSportName(tournament.getSport().getName());

        List<FixtureDTO.RoundFixtureDTO> roundFixtures = new ArrayList<>();

        // Generate fixtures for each round, starting from the earliest round (highest round value)
        for (int roundValue = numRounds; roundValue >= 1; roundValue--) {
            FixtureDTO.RoundFixtureDTO roundFixture = generateRoundFixture(tournament, roundValue, participatingTeams, numRounds, Round.TournamentType.KNOCKOUT);
            roundFixtures.add(roundFixture);
        }

        fixture.setRounds(roundFixtures);
        return fixture;
    }

    /**
     * Generate fixture for a tournament with custom round types
     */
    public FixtureDTO generateFixtureWithRoundTypes(Long tournamentId, List<RoundTypeConfig> roundConfigs) {
        // Get tournament
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new IllegalArgumentException("Tournament not found with id: " + tournamentId));

        // Get participating teams
        List<Team> participatingTeams = teamRepository.findByTournamentTournamentId(tournamentId);
        if (participatingTeams.isEmpty()) {
            throw new IllegalArgumentException("No participating teams found for tournament: " + tournamentId);
        }

        FixtureDTO fixture = new FixtureDTO();
        fixture.setTournamentId(tournament.getTournamentId());
        fixture.setTournamentName(tournament.getName());
        fixture.setSportName(tournament.getSport().getName());

        List<FixtureDTO.RoundFixtureDTO> roundFixtures = new ArrayList<>();

        // Generate fixtures for each configured round
        for (RoundTypeConfig config : roundConfigs) {
            FixtureDTO.RoundFixtureDTO roundFixture = generateRoundFixture(tournament, config.getRoundValue(),
                participatingTeams, roundConfigs.size(), config.getType());
            roundFixtures.add(roundFixture);
        }

        fixture.setRounds(roundFixtures);
        return fixture;
    }

    @Data
    @AllArgsConstructor
    public static class RoundTypeConfig {
        private Integer roundValue;
        private Round.TournamentType type;
    }

    private FixtureDTO.RoundFixtureDTO generateRoundFixture(Tournament tournament, int roundValue,
                                                           List<Team> participatingTeams, int totalRounds, Round.TournamentType type) {
        FixtureDTO.RoundFixtureDTO roundFixture = new FixtureDTO.RoundFixtureDTO();
        roundFixture.setRoundValue(roundValue);
        roundFixture.setRoundName(Round.calculateRoundName(roundValue));
        roundFixture.setType(type);

        List<Team> teamsForRound;
        int expectedTeamsInRound = (int) Math.pow(2, roundValue);

        if (roundValue == totalRounds) {
            // First round - use all participating teams
            teamsForRound = new ArrayList<>(participatingTeams);
            // If we have more teams than expected, take a subset (in practice, this should be handled by tournament format)
            if (teamsForRound.size() > expectedTeamsInRound) {
                Collections.shuffle(teamsForRound);
                teamsForRound = teamsForRound.subList(0, expectedTeamsInRound);
            }
        } else {
            // For subsequent rounds, we would normally get winners from previous round
            // Since we're generating fixtures upfront, we'll create placeholder matches
            // In a real implementation, these would be populated when previous round winners are known
            teamsForRound = new ArrayList<>();
            // For demo purposes, we'll use participating teams but note that this should be winners
            List<Team> tempTeams = new ArrayList<>(participatingTeams);
            Collections.shuffle(tempTeams);
            int teamsNeeded = Math.min(expectedTeamsInRound, tempTeams.size());
            teamsForRound = tempTeams.subList(0, teamsNeeded);
        }

        // Generate matches based on tournament type
        List<MatchDTO> matches = new ArrayList<>();
        if (type == Round.TournamentType.KNOCKOUT) {
            matches = generateKnockoutMatches(tournament, roundValue, teamsForRound);
        } else if (type == Round.TournamentType.ROUND_ROBIN) {
            matches = generateRoundRobinMatches(tournament, roundValue, teamsForRound);
        }

        roundFixture.setMatches(matches);
        return roundFixture;
    }

    private List<MatchDTO> generateKnockoutMatches(Tournament tournament, int roundValue, List<Team> teams) {
        List<MatchDTO> matches = new ArrayList<>();
        // Shuffle teams for random pairing
        Collections.shuffle(teams);

        // Create matches by pairing teams
        for (int i = 0; i < teams.size(); i += 2) {
            if (i + 1 < teams.size()) {
                Team team1 = teams.get(i);
                Team team2 = teams.get(i + 1);

                MatchDTO match = createMatchDTO(tournament, roundValue, team1, team2);
                matches.add(match);
            }
        }

        return matches;
    }

    private List<MatchDTO> generateRoundRobinMatches(Tournament tournament, int roundValue, List<Team> teams) {
        List<MatchDTO> matches = new ArrayList<>();

        // Round-robin: each team plays every other team once
        for (int i = 0; i < teams.size(); i++) {
            for (int j = i + 1; j < teams.size(); j++) {
                Team team1 = teams.get(i);
                Team team2 = teams.get(j);

                MatchDTO match = createMatchDTO(tournament, roundValue, team1, team2);
                matches.add(match);
            }
        }

        return matches;
    }

    private MatchDTO createMatchDTO(Tournament tournament, int roundValue, Team team1, Team team2) {
        MatchDTO match = new MatchDTO();
        match.setTournamentId(tournament.getTournamentId());
        match.setTournamentName(tournament.getName());
        match.setSportId(tournament.getSport().getSportId());
        match.setSportName(tournament.getSport().getName());
        match.setTeam1Id(team1.getTeamId());
        match.setTeam1Name(team1.getTeamName());
        match.setTeam2Id(team2.getTeamId());
        match.setTeam2Name(team2.getTeamName());
        match.setRoundValue(roundValue);
        match.setRoundName(Round.calculateRoundName(roundValue));
        match.setStatus(Match.MatchStatus.SCHEDULED);

        return match;
    }    private FixtureDTO.RoundFixtureDTO generateRoundFixture(Tournament tournament, int roundValue,
                                                           List<Team> participatingTeams,
                                                           List<FixtureDTO.RoundFixtureDTO> previousRounds) {
        FixtureDTO.RoundFixtureDTO roundFixture = new FixtureDTO.RoundFixtureDTO();
        roundFixture.setRoundValue(roundValue);
        roundFixture.setRoundName(Round.calculateRoundName(roundValue));

        List<Team> teamsForRound;

        if (roundValue == 1) {
            // First round uses participating teams
            teamsForRound = new ArrayList<>(participatingTeams);
        } else {
            // Subsequent rounds use winners from previous round
            teamsForRound = getWinnersFromPreviousRound(previousRounds, roundValue);
        }

        // Shuffle teams for random pairing
        Collections.shuffle(teamsForRound);

        // Create matches by pairing teams
        List<MatchDTO> matches = new ArrayList<>();
        for (int i = 0; i < teamsForRound.size(); i += 2) {
            if (i + 1 < teamsForRound.size()) {
                Team team1 = teamsForRound.get(i);
                Team team2 = teamsForRound.get(i + 1);

                MatchDTO match = new MatchDTO();
                match.setTournamentId(tournament.getTournamentId());
                match.setTournamentName(tournament.getName());
                match.setSportId(tournament.getSport().getSportId());
                match.setSportName(tournament.getSport().getName());
                match.setTeam1Id(team1.getTeamId());
                match.setTeam1Name(team1.getTeamName());
                match.setTeam2Id(team2.getTeamId());
                match.setTeam2Name(team2.getTeamName());
                match.setRoundValue(roundValue);
                match.setRoundName(Round.calculateRoundName(roundValue));
                match.setStatus(Match.MatchStatus.SCHEDULED);

                matches.add(match);
            }
        }

        roundFixture.setMatches(matches);
        return roundFixture;
    }

    private List<Team> getWinnersFromPreviousRound(List<FixtureDTO.RoundFixtureDTO> previousRounds, int currentRoundValue) {
        // Find the previous round (higher round value)
        FixtureDTO.RoundFixtureDTO previousRound = previousRounds.stream()
                .filter(r -> r.getRoundValue() == currentRoundValue + 1)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Previous round not found for round value: " + currentRoundValue));

        List<Team> winners = new ArrayList<>();

        // For each match in previous round, determine winner
        // Since matches are DTOs without actual winner data, we'll simulate winners
        // In a real implementation, this would come from completed matches
        for (MatchDTO match : previousRound.getMatches()) {
            // For now, randomly select one of the two teams as winner
            // In practice, this should be based on actual match results
            Team winner = Math.random() < 0.5 ?
                createTeamFromDTO(match.getTeam1Id(), match.getTeam1Name()) :
                createTeamFromDTO(match.getTeam2Id(), match.getTeam2Name());
            winners.add(winner);
        }

        return winners;
    }

    private Team createTeamFromDTO(Long teamId, String teamName) {
        Team team = new Team();
        team.setTeamId(teamId);
        team.setTeamName(teamName);
        return team;
    }
}