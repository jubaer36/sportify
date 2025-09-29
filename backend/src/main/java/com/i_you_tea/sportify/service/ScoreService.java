package com.i_you_tea.sportify.service;

import com.i_you_tea.sportify.entity.Score;
import com.i_you_tea.sportify.entity.Match;
import com.i_you_tea.sportify.entity.Team;
import com.i_you_tea.sportify.entity.User;
import com.i_you_tea.sportify.repository.ScoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ScoreService {
    
    private final ScoreRepository scoreRepository;
    
    public List<Score> getAllScores() {
        return scoreRepository.findAll();
    }

    public Score createScore(Score score) {
        return scoreRepository.save(score);
    }
}