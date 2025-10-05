package com.i_you_tea.sportify.service;

import com.i_you_tea.sportify.entity.Round;
import com.i_you_tea.sportify.entity.Match;
import com.i_you_tea.sportify.repository.MatchRepository;
import com.i_you_tea.sportify.repository.RoundRepository;
import com.i_you_tea.sportify.entity.Tournament;
import com.i_you_tea.sportify.entity.Sport;
import com.i_you_tea.sportify.entity.Team;
import com.i_you_tea.sportify.repository.TournamentRepository;
import com.i_you_tea.sportify.repository.TeamRepository;
import com.i_you_tea.sportify.repository.SportRepository;
import com.i_you_tea.sportify.dto.FixtureDTO;
import com.i_you_tea.sportify.dto.MatchDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
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

    
    public List<Tournament> getAllTournaments() {
        return tournamentRepository.findAll();
    }

    public Tournament createTournament(Tournament tournament) {
        return tournamentRepository.save(tournament);
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
     * Process:
     * 1. Fetch tournament and registered teams
     * 2. Count teams and upscale to nearest power of 2
     * 3. Calculate number of rounds using log2
     * 4. Create rounds with both round robin and knockout options
     * 5. Store matches for each round
     */
    public FixtureDTO generateFixture(Long tournamentId) {
        // Step 1: Fetch tournament
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new IllegalArgumentException("Tournament not found with id: " + tournamentId));

        // Step 2: Fetch registered teams for this tournament
        List<Team> registeredTeams = teamRepository.findByTournamentTournamentId(tournamentId);
        if (registeredTeams.isEmpty()) {
            throw new IllegalArgumentException("No teams registered for tournament: " + tournamentId);
        }

        // Step 3: Count total number of teams and upscale to nearest power of 2
        int teamCount = registeredTeams.size();
        int upscaledTeamCount = upscaleToNearestPowerOf2(teamCount);
        
        // Step 4: Calculate number of rounds using log2 of upscaled value
        int numRounds = (int) (Math.log(upscaledTeamCount) / Math.log(2));

        FixtureDTO fixture = new FixtureDTO();
        fixture.setTournamentId(tournament.getTournamentId());
        fixture.setTournamentName(tournament.getName());
        fixture.setSportName(tournament.getSport().getName());

        List<FixtureDTO.RoundFixtureDTO> roundFixtures = new ArrayList<>();

        // Step 5: Generate fixtures for each round (from first round to final)
        // First round uses all registered teams, subsequent rounds will be populated after winners are determined
        for (int roundNumber = numRounds; roundNumber >= 1; roundNumber--) {
            // Create round with both knockout and round robin options
            // For now, we'll create the round structure without committing to a type
            // The type will be selected when the round is about to start
            FixtureDTO.RoundFixtureDTO roundFixture = generateRoundStructure(
                tournament, roundNumber, registeredTeams, numRounds, upscaledTeamCount);
            roundFixtures.add(roundFixture);
        }

        fixture.setRounds(roundFixtures);
        
        // Mark tournament as having generated fixture
        tournament.setFixtureGenerated(true);
        tournamentRepository.save(tournament);
        
        return fixture;
    }
    
    /**
     * Upscale a number to the nearest power of 2
     * Examples: 36 -> 64, 10 -> 16, 5 -> 8, 50 -> 64
     */
    private int upscaleToNearestPowerOf2(int number) {
        if (number <= 0) {
            return 1;
        }
        // Find the next power of 2 greater than or equal to the number
        int power = 1;
        while (power < number) {
            power *= 2;
        }
        return power;
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
        
        // Mark tournament as having generated fixture
        tournament.setFixtureGenerated(true);
        tournamentRepository.save(tournament);
        
        return fixture;
    }

    @Data
    @AllArgsConstructor
    public static class RoundTypeConfig {
        private Integer roundValue;
        private Round.TournamentType type;
    }

        /**
         * Generate a round fixture for a specific round value with an explicit type (custom flow)
         * - Persists the round with the provided type
         * - For the highest round (first to be played), prepare preview matches
         * - For subsequent rounds, keep matches empty until previous rounds complete
         */
        private FixtureDTO.RoundFixtureDTO generateRoundFixture(Tournament tournament,
                                                                int roundValue,
                                                                List<Team> participatingTeams,
                                                                int totalRounds,
                                                                Round.TournamentType type) {
            FixtureDTO.RoundFixtureDTO roundFixture = new FixtureDTO.RoundFixtureDTO();
            roundFixture.setRoundValue(roundValue);
            roundFixture.setRoundName(Round.calculateRoundName(roundValue));
            roundFixture.setType(type);

            // Persist round with selected type
            Round round = new Round();
            round.setRoundValue(roundValue);
            round.setTournament(tournament);
            round.setType(type);
            Round savedRound = roundRepository.save(round);
            roundFixture.setRoundId(savedRound.getRoundId());

            // Determine the maximum round value among the configured rounds
            // totalRounds here is a count; we will instead compute the current maximum from DB
            // When configs are provided with explicit roundValue (e.g., 6..1), we should treat the highest value as the first round.
            // Use the passed roundValue relative to tournament scale: preview matches only for the highest roundValue among all rounds in DB

            // Check if this saved round is the highest round for this tournament currently
            List<Round> existingRounds = roundRepository.findByTournament_TournamentId(tournament.getTournamentId());
            int currentMax = existingRounds.stream()
                .mapToInt(Round::getRoundValue)
                .max()
                .orElse(roundValue);

            if (roundValue == currentMax) {
                // Prepare teams for the first (highest) round and create preview matches for the chosen type
                List<Team> teamsForRound = prepareTeamsForFirstRound(participatingTeams,
                        upscaleToNearestPowerOf2(participatingTeams.size()));

                List<MatchDTO> previewMatches = (type == Round.TournamentType.KNOCKOUT)
                        ? generateKnockoutMatches(tournament, roundValue, teamsForRound)
                        : generateRoundRobinMatches(tournament, roundValue, teamsForRound);
                roundFixture.setMatches(previewMatches);
            } else {
                roundFixture.setMatches(new ArrayList<>());
            }

            return roundFixture;
        }

    /**
     * Generate round structure with both knockout and round robin options
     * The round is created in the database but matches are not yet committed
     * Actual match generation happens when round type is selected
     */
    private FixtureDTO.RoundFixtureDTO generateRoundStructure(Tournament tournament, int roundNumber,
                                                              List<Team> registeredTeams, int totalRounds,
                                                              int upscaledTeamCount) {
        FixtureDTO.RoundFixtureDTO roundFixture = new FixtureDTO.RoundFixtureDTO();
        roundFixture.setRoundValue(roundNumber);
        roundFixture.setRoundName(Round.calculateRoundName(roundNumber));
        
        // For the first round (highest number), create and save the round
        if (roundNumber == totalRounds) {
            // Create the round entity (initially without a type - to be decided later)
            Round round = new Round();
            round.setRoundValue(roundNumber);
            round.setTournament(tournament);
            // Type will be set to null initially, to be decided when round starts
            round.setType(null);
            
            Round savedRound = roundRepository.save(round);
            roundFixture.setRoundId(savedRound.getRoundId());
            
            // For first round, we know the teams - create matches for both possible types
            List<Team> teamsForRound = prepareTeamsForFirstRound(registeredTeams, upscaledTeamCount);
            
            // Generate both knockout and round robin options (not saved yet)
            List<MatchDTO> knockoutMatches = generateKnockoutMatches(tournament, roundNumber, teamsForRound);
            // Also compute round-robin preview to ensure both options are available conceptually
            // but we will display knockout by default here.
            generateRoundRobinMatches(tournament, roundNumber, teamsForRound);
            
            // For display purposes, show knockout by default (but nothing is saved yet)
            roundFixture.setType(null); // Type not yet decided
            roundFixture.setMatches(knockoutMatches); // Show knockout as preview
        } else {
            // For subsequent rounds, create placeholder round
            Round round = new Round();
            round.setRoundValue(roundNumber);
            round.setTournament(tournament);
            round.setType(null);
            
            Round savedRound = roundRepository.save(round);
            roundFixture.setRoundId(savedRound.getRoundId());
            roundFixture.setType(null);
            roundFixture.setMatches(new ArrayList<>()); // Empty until previous round completes
        }

        return roundFixture;
    }
    
    /**
     * Prepare teams for the first round
     * If we have fewer teams than upscaled count, some teams get byes
     */
    private List<Team> prepareTeamsForFirstRound(List<Team> registeredTeams, int upscaledTeamCount) {
        List<Team> teamsForRound = new ArrayList<>(registeredTeams);
        Collections.shuffle(teamsForRound); // Randomize team order
        
        // If we have fewer teams than slots, we'll handle byes in match generation
        return teamsForRound;
    }
    
    /**
     * Select tournament type for a round and generate matches accordingly
     * This is called when a round is about to start
     */
    public void selectRoundTypeAndGenerateMatches(Long roundId, Round.TournamentType selectedType) {
        Round round = roundRepository.findById(roundId)
                .orElseThrow(() -> new IllegalArgumentException("Round not found with id: " + roundId));
        
        // Clear any existing matches for this round (important for regeneration)
        List<Match> existingMatches = matchRepository.findByRound_RoundId(roundId);
        if (!existingMatches.isEmpty()) {
            System.out.println("Deleting " + existingMatches.size() + " existing matches for round " + roundId);
            matchRepository.deleteByRound_RoundId(roundId);
        }
        
        // Set the selected type
        round.setType(selectedType);
        roundRepository.save(round);
        
        // Get teams for this round
        List<Team> teamsForRound = getTeamsForRound(round);
        
        // Generate and save matches based on selected type
        if (selectedType == Round.TournamentType.KNOCKOUT) {
            generateAndSaveKnockoutMatches(round, teamsForRound);
        } else if (selectedType == Round.TournamentType.ROUND_ROBIN) {
            generateAndSaveRoundRobinMatches(round, teamsForRound);
        }
        
        System.out.println("Generated new matches for round " + roundId + " with type " + selectedType);
    }
    
    /**
     * Get teams for a specific round
     * For first round: registered teams
     * For subsequent rounds: winners from previous round
     */
    private List<Team> getTeamsForRound(Round round) {
        Tournament tournament = round.getTournament();
        
        // Get all rounds for this tournament sorted by round value descending
        List<Round> allRounds = roundRepository.findByTournament_TournamentId(tournament.getTournamentId());
        allRounds.sort((r1, r2) -> r2.getRoundValue().compareTo(r1.getRoundValue()));
        
        // Find if this is the first round
        int maxRoundValue = allRounds.stream()
                .mapToInt(Round::getRoundValue)
                .max()
                .orElse(1);
        
        if (round.getRoundValue() == maxRoundValue) {
            // First round - return registered teams
            return teamRepository.findByTournamentTournamentId(tournament.getTournamentId());
        } else {
            // Subsequent round - get winners from previous round
            Round previousRound = allRounds.stream()
                    .filter(r -> r.getRoundValue() == round.getRoundValue() + 1)
                    .findFirst()
                    .orElseThrow(() -> new IllegalStateException("Previous round not found"));
            
            return getWinnersFromRound(previousRound);
        }
    }
    
    /**
     * Get winners from a completed round
     */
    private List<Team> getWinnersFromRound(Round round) {
        List<Match> matches = matchRepository.findByRound_RoundId(round.getRoundId());
        List<Team> winners = new ArrayList<>();
        
        for (Match match : matches) {
            if (match.getStatus() == Match.MatchStatus.COMPLETED && match.getWinnerTeam() != null) {
                winners.add(match.getWinnerTeam());
            }
        }
        
        if (winners.isEmpty()) {
            throw new IllegalStateException("No winners found in round: " + round.getRoundName() + 
                    ". Make sure all matches are completed before proceeding to the next round.");
        }
        
        return winners;
    }
    
    /**
     * Generate and save knockout matches for a round
     */
    private void generateAndSaveKnockoutMatches(Round round, List<Team> teams) {
        List<Match> matches = new ArrayList<>();
        Collections.shuffle(teams); // Randomize pairings
        
        // Create matches by pairing teams
        for (int i = 0; i < teams.size(); i += 2) {
            if (i + 1 < teams.size()) {
                Match match = new Match();
                match.setTournament(round.getTournament());
                match.setSport(round.getTournament().getSport());
                match.setTeam1(teams.get(i));
                match.setTeam2(teams.get(i + 1));
                match.setRound(round);
                match.setStatus(Match.MatchStatus.SCHEDULED);
                matches.add(match);
            } else {
                // Odd number of teams - create a BYE match with automatic advancement
                Match byeMatch = new Match();
                byeMatch.setTournament(round.getTournament());
                byeMatch.setSport(round.getTournament().getSport());
                byeMatch.setTeam1(teams.get(i));
                byeMatch.setTeam2(null); // No opponent
                byeMatch.setRound(round);
                // Mark as completed with team1 as winner to auto-advance
                byeMatch.setStatus(Match.MatchStatus.COMPLETED);
                byeMatch.setWinnerTeam(teams.get(i));
                matches.add(byeMatch);
            }
        }
        
        matchRepository.saveAll(matches);
    }
    
    /**
     * Generate and save round robin matches for a round
     */
    private void generateAndSaveRoundRobinMatches(Round round, List<Team> teams) {
        List<Match> matches = new ArrayList<>();
        
        System.out.println("Generating ROUND_ROBIN matches for " + teams.size() + " teams");
        System.out.println("Expected matches: " + (teams.size() * (teams.size() - 1) / 2));
        
        // Round-robin: each team plays every other team once
        for (int i = 0; i < teams.size(); i++) {
            for (int j = i + 1; j < teams.size(); j++) {
                Match match = new Match();
                match.setTournament(round.getTournament());
                match.setSport(round.getTournament().getSport());
                match.setTeam1(teams.get(i));
                match.setTeam2(teams.get(j));
                match.setRound(round);
                match.setStatus(Match.MatchStatus.SCHEDULED);
                matches.add(match);
            }
        }
        
        System.out.println("Generated " + matches.size() + " ROUND_ROBIN matches");
        matchRepository.saveAll(matches);
    }

    /**
     * Generate knockout match DTOs (for preview purposes, not saved to DB)
     */
    private List<MatchDTO> generateKnockoutMatches(Tournament tournament, int roundValue, List<Team> teams) {
        List<MatchDTO> matches = new ArrayList<>();
        
        // Create matches by pairing teams
        for (int i = 0; i < teams.size(); i += 2) {
            if (i + 1 < teams.size()) {
                Team team1 = teams.get(i);
                Team team2 = teams.get(i + 1);

                MatchDTO match = createMatchDTO(tournament, roundValue, team1, team2);
                matches.add(match);
            } else {
                // Odd number of teams - this team gets a bye
                // Create a special match DTO to indicate bye
                MatchDTO byeMatch = createMatchDTO(tournament, roundValue, teams.get(i), null);
                matches.add(byeMatch);
            }
        }

        return matches;
    }

    /**
     * Generate round robin match DTOs (for preview purposes, not saved to DB)
     */
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

    /**
     * Create a match DTO for preview purposes
     */
    private MatchDTO createMatchDTO(Tournament tournament, int roundValue, Team team1, Team team2) {
        MatchDTO match = new MatchDTO();
        match.setTournamentId(tournament.getTournamentId());
        match.setTournamentName(tournament.getName());
        match.setSportId(tournament.getSport().getSportId());
        match.setSportName(tournament.getSport().getName());
        
        if (team1 != null) {
            match.setTeam1Id(team1.getTeamId());
            match.setTeam1Name(team1.getTeamName());
        }
        
        if (team2 != null) {
            match.setTeam2Id(team2.getTeamId());
            match.setTeam2Name(team2.getTeamName());
        } else {
            // Bye match
            match.setTeam2Name("BYE");
        }
        
        match.setRoundValue(roundValue);
        match.setRoundName(Round.calculateRoundName(roundValue));
        match.setStatus(Match.MatchStatus.SCHEDULED);

        return match;
    }    /**
     * Check if a round is complete (all matches finished)
     */
    public boolean isRoundComplete(Long roundId) {
        // Validate round existence
        roundRepository.findById(roundId)
                .orElseThrow(() -> new IllegalArgumentException("Round not found with id: " + roundId));

        List<Match> matches = matchRepository.findByRound_RoundId(roundId);
        
        if (matches.isEmpty()) {
            return false;
        }
        
        // Check if all matches are completed
        return matches.stream()
                .allMatch(match -> match.getStatus() == Match.MatchStatus.COMPLETED);
    }
    
    /**
     * Get available round types for selection
     */
    public List<Round.TournamentType> getAvailableRoundTypes() {
        return Arrays.asList(Round.TournamentType.KNOCKOUT, Round.TournamentType.ROUND_ROBIN);
    }
    
    /**
     * Advance to next round after current round completion
     * This generates the next round's matches based on winners
     */
    public void advanceToNextRound(Long currentRoundId, Round.TournamentType nextRoundType) {
        Round currentRound = roundRepository.findById(currentRoundId)
                .orElseThrow(() -> new IllegalArgumentException("Round not found with id: " + currentRoundId));
        
        // Verify current round is complete
        if (!isRoundComplete(currentRoundId)) {
            throw new IllegalStateException("Cannot advance: Current round is not complete");
        }
        
        // Get the next round (one less in round value)
        Round nextRound = roundRepository.findByTournament_TournamentIdAndRoundValue(
                currentRound.getTournament().getTournamentId(),
                currentRound.getRoundValue() - 1)
                .orElseThrow(() -> new IllegalStateException("Next round not found. This might be the final round."));
        
        // Select type and generate matches for next round
        selectRoundTypeAndGenerateMatches(nextRound.getRoundId(), nextRoundType);
    }

    /**
     * Fetch existing fixture with actual saved matches from database
     * Unlike generateFixture(), this returns the real matches that have been saved
     */
    public FixtureDTO getExistingFixture(Long tournamentId) {
        // Fetch tournament
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new IllegalArgumentException("Tournament not found with id: " + tournamentId));

        FixtureDTO fixture = new FixtureDTO();
        fixture.setTournamentId(tournament.getTournamentId());
        fixture.setTournamentName(tournament.getName());
        fixture.setSportName(tournament.getSport().getName());

        // Get all rounds for this tournament
        List<Round> rounds = roundRepository.findByTournament_TournamentId(tournamentId);
        
        if (rounds.isEmpty()) {
            // No rounds exist yet, return empty fixture
            fixture.setRounds(new ArrayList<>());
            return fixture;
        }

        // Sort rounds by round value descending (highest round first)
        rounds.sort((r1, r2) -> r2.getRoundValue().compareTo(r1.getRoundValue()));

        List<FixtureDTO.RoundFixtureDTO> roundFixtures = new ArrayList<>();

        for (Round round : rounds) {
            FixtureDTO.RoundFixtureDTO roundFixture = new FixtureDTO.RoundFixtureDTO();
            roundFixture.setRoundId(round.getRoundId());
            roundFixture.setRoundValue(round.getRoundValue());
            roundFixture.setRoundName(Round.calculateRoundName(round.getRoundValue()));
            roundFixture.setType(round.getType());

            // Fetch actual saved matches for this round (ordered by matchId for consistency)
            List<Match> matches = matchRepository.findByRound_RoundId(round.getRoundId());
            // Sort matches by matchId to ensure consistent ordering
            matches.sort((m1, m2) -> m1.getMatchId().compareTo(m2.getMatchId()));
            List<MatchDTO> matchDTOs = new ArrayList<>();

            for (Match match : matches) {
                MatchDTO matchDTO = new MatchDTO();
                matchDTO.setMatchId(match.getMatchId());
                matchDTO.setTournamentId(tournament.getTournamentId());
                matchDTO.setTournamentName(tournament.getName());
                matchDTO.setSportId(tournament.getSport().getSportId());
                matchDTO.setSportName(tournament.getSport().getName());
                
                if (match.getTeam1() != null) {
                    matchDTO.setTeam1Id(match.getTeam1().getTeamId());
                    matchDTO.setTeam1Name(match.getTeam1().getTeamName());
                }
                
                if (match.getTeam2() != null) {
                    matchDTO.setTeam2Id(match.getTeam2().getTeamId());
                    matchDTO.setTeam2Name(match.getTeam2().getTeamName());
                } else {
                    matchDTO.setTeam2Name("BYE");
                }
                
                matchDTO.setRoundId(round.getRoundId());
                matchDTO.setRoundValue(round.getRoundValue());
                matchDTO.setRoundName(Round.calculateRoundName(round.getRoundValue()));
                matchDTO.setStatus(match.getStatus());
                matchDTO.setScheduledTime(match.getScheduledTime());
                matchDTO.setVenue(match.getVenue());
                
                if (match.getWinnerTeam() != null) {
                    matchDTO.setWinnerTeamId(match.getWinnerTeam().getTeamId());
                    matchDTO.setWinnerTeamName(match.getWinnerTeam().getTeamName());
                }
                
                matchDTOs.add(matchDTO);
            }

            roundFixture.setMatches(matchDTOs);
            roundFixtures.add(roundFixture);
        }

        fixture.setRounds(roundFixtures);
        return fixture;
    }
}