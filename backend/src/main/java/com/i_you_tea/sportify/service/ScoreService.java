package com.i_you_tea.sportify.service;

import com.i_you_tea.sportify.dto.ScoreDTO;
import com.i_you_tea.sportify.entity.Match;
import com.i_you_tea.sportify.entity.Score;
import com.i_you_tea.sportify.repository.MatchRepository;
import com.i_you_tea.sportify.repository.ScoreRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ScoreService {

    @Autowired
    private ScoreRepository scoreRepository;

    @Autowired
    private MatchRepository matchRepository;

    public List<ScoreDTO> getScoresByMatch(Long matchId) {
        Optional<Match> matchOpt = matchRepository.findById(matchId);
        if (matchOpt.isPresent()) {
            List<Score> scores = scoreRepository.findByMatch(matchOpt.get());
            return scores.stream().map(ScoreDTO::fromEntity).collect(Collectors.toList());
        }
        return List.of();
    }

    public ScoreDTO saveScore(ScoreDTO scoreDTO) {
        Score score = scoreDTO.toEntity();
        Match match = matchRepository.findById(scoreDTO.getMatchId()).orElse(null);
        score.setMatch(match);
        Score saved = scoreRepository.save(score);
        return ScoreDTO.fromEntity(saved);
    }

    public void deleteScore(Long scoreId) {
        scoreRepository.deleteById(scoreId);
    }

    // Inside ScoreService class

    // New method for updating a score
    public ScoreDTO updateScore(Long scoreId, ScoreDTO scoreDTO) {
        Score score = scoreRepository.findById(scoreId)
                .orElseThrow(() -> new RuntimeException("Score not found"));

        // Update match if provided
        if (scoreDTO.getMatchId() != null) {
            Match match = matchRepository.findById(scoreDTO.getMatchId())
                    .orElseThrow(() -> new RuntimeException("Match not found"));
            score.setMatch(match);
        }

        // Update team and points
        score.setTeamAId(scoreDTO.getTeamAId());
        score.setTeamAPoints(scoreDTO.getTeamAPoints());
        score.setTeamBId(scoreDTO.getTeamBId());
        score.setTeamBPoints(scoreDTO.getTeamBPoints());

        Score updated = scoreRepository.save(score);
        return ScoreDTO.fromEntity(updated);
    }

}