package com.i_you_tea.sportify.service;

import com.i_you_tea.sportify.entity.Match;
import com.i_you_tea.sportify.entity.Tournament;
import com.i_you_tea.sportify.entity.Team;
import com.i_you_tea.sportify.entity.Sport;
import com.i_you_tea.sportify.entity.Round;
import com.i_you_tea.sportify.repository.MatchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MatchService {
    private final MatchRepository matchRepository;
    
    public List<Match> getAllMatches() {
        return matchRepository.findAll();
    }

    public Match createMatch(Match match) {
        return matchRepository.save(match);
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
        
        return matchRepository.save(existingMatch);
    }
    
    public void deleteMatch(Long matchId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new IllegalArgumentException("Match not found with id: " + matchId));
        matchRepository.delete(match);
    }
}