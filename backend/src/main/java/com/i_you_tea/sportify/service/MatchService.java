package com.i_you_tea.sportify.service;

import com.i_you_tea.sportify.entity.Match;
import com.i_you_tea.sportify.entity.Tournament;
import com.i_you_tea.sportify.entity.Team;
import com.i_you_tea.sportify.entity.Sport;
import com.i_you_tea.sportify.entity.Round;
import com.i_you_tea.sportify.repository.MatchRepository;
import com.i_you_tea.sportify.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class MatchService {
    private final MatchRepository matchRepository;
    private final TeamRepository teamRepository;
    
    public List<Match> getAllMatches() {
        return matchRepository.findAll();
    }

    public Match createMatch(Match match) {
        return matchRepository.save(match);
    }

    public void generateMatchesForRound(Round round) {
        System.out.println("[MatchService] Generating matches for round: " + round.getRoundId());
        
        Tournament tournament = round.getTournament();
        // For round 1, get only non-dummy teams; for subsequent rounds this method shouldn't be used
        List<Team> teams = teamRepository.findByTournamentTournamentId(tournament.getTournamentId())
                .stream()
                .filter(team -> round.getRoundValue() == 1 ? !team.getDummy() : true)  // Filter dummy teams only for round 1
                .toList();
        
        System.out.println("[MatchService] Found " + teams.size() + " teams for tournament: " + tournament.getTournamentId());

        generateMatchesWithTeams(round, teams);
    }

    public void generateMatchesForRound(Round round, List<Team> participatingTeams) {
        System.out.println("[MatchService] Generating matches for round: " + round.getRoundId() + " with " + participatingTeams.size() + " specific teams");
        
        generateMatchesWithTeams(round, participatingTeams);
    }

    private void generateMatchesWithTeams(Round round, List<Team> teams) {
        // Clear existing matches for this round
        List<Match> existingMatches = matchRepository.findByRound(round);
        System.out.println("[MatchService] Deleting " + existingMatches.size() + " existing matches");
        
        try {
            matchRepository.deleteAll(existingMatches);
            System.out.println("[MatchService] Existing matches deleted successfully");
        } catch (Exception e) {
            System.err.println("[MatchService] Error deleting existing matches: " + e.getMessage());
            throw e;
        }

        if (round.getType() == Round.TournamentType.KNOCKOUT) {
            System.out.println("[MatchService] Generating KNOCKOUT matches");
            generateKnockoutMatches(round, teams);
        } else if (round.getType() == Round.TournamentType.ROUND_ROBIN) {
            System.out.println("[MatchService] Generating ROUND_ROBIN matches");
            generateRoundRobinMatches(round, teams);
        }
        
        System.out.println("[MatchService] Match generation completed");
    }

    private void generateKnockoutMatches(Round round, List<Team> teams) {
        Tournament tournament = round.getTournament();
        List<Team> shuffledTeams = new ArrayList<>(teams);
        Collections.shuffle(shuffledTeams);

        for (int i = 0; i < shuffledTeams.size() / 2; i++) {
            Match match = new Match();
            match.setTournament(tournament);
            match.setSport(tournament.getSport());
            match.setRound(round);
            match.setTeam1(shuffledTeams.get(i * 2));
            match.setTeam2(shuffledTeams.get(i * 2 + 1));
            match.setStatus(Match.MatchStatus.valueOf("SCHEDULED"));
            matchRepository.save(match);
        }

        if (shuffledTeams.size() % 2 != 0) {
            // Handle odd number of teams, give a bye to the last team
            Match match = new Match();
            match.setTournament(tournament);
            match.setSport(tournament.getSport());
            match.setRound(round);
            match.setTeam1(shuffledTeams.get(shuffledTeams.size() - 1));
            match.setTeam2(null); // Represents a bye
            match.setStatus(Match.MatchStatus.valueOf("COMPLETED")); // Bye match is instantly completed
            match.setWinnerTeam(shuffledTeams.get(shuffledTeams.size() - 1));
            matchRepository.save(match);
        }
    }

    private void generateRoundRobinMatches(Round round, List<Team> teams) {
        Tournament tournament = round.getTournament();
        for (int i = 0; i < teams.size(); i++) {
            for (int j = i + 1; j < teams.size(); j++) {
                Match match = new Match();
                match.setTournament(tournament);
                match.setSport(tournament.getSport());
                match.setRound(round);
                match.setTeam1(teams.get(i));
                match.setTeam2(teams.get(j));
                match.setStatus(Match.MatchStatus.valueOf("SCHEDULED"));
                matchRepository.save(match);
            }
        }
    }
    
    public Optional<Match> getMatchById(Long matchId) {
        return matchRepository.findById(matchId);
    }
    
    public List<Match> getMatchesByRound(Round round) {
        return matchRepository.findByRound(round);
    }
    
    public List<Match> getMatchesByRoundId(Long roundId) {
        return matchRepository.findByRound_RoundId(roundId);
    }
    
    public List<Match> getMatchesByRoundValue(Integer roundValue) {
        return matchRepository.findByRound_RoundValue(roundValue);
    }
    
    public List<Match> getMatchesByRoundAndTournament(Long roundId, Long tournamentId) {
        return matchRepository.findByRoundIdAndTournamentId(roundId, tournamentId);
    }

    // Fetch matches by tournament ID
    public List<Match> getMatchesByTournamentId(Long tournamentId) {
        return matchRepository.findByTournament_TournamentId(tournamentId);
    }


    public Match updateMatch(Long matchId, Match matchDetails) {
        Match existingMatch = matchRepository.findById(matchId)
                .orElseThrow(() -> new IllegalArgumentException("Match not found with id: " + matchId));
        
        existingMatch.setScheduledTime(matchDetails.getScheduledTime());
        existingMatch.setVenue(matchDetails.getVenue());
        existingMatch.setStatus(matchDetails.getStatus());
        existingMatch.setWinnerTeam(matchDetails.getWinnerTeam());
        existingMatch.setRound(matchDetails.getRound());
        existingMatch.setTeamAFinalScore(matchDetails.getTeamAFinalScore());
        existingMatch.setTeamBFinalScore(matchDetails.getTeamBFinalScore());
        
        return matchRepository.save(existingMatch);
    }
    
    public void deleteMatch(Long matchId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new IllegalArgumentException("Match not found with id: " + matchId));
        matchRepository.delete(match);
    }
}