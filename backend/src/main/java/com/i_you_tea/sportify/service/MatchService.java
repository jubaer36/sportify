package com.i_you_tea.sportify.service;

import com.i_you_tea.sportify.entity.Match;
import com.i_you_tea.sportify.entity.Tournament;
import com.i_you_tea.sportify.entity.Team;
import com.i_you_tea.sportify.entity.Sport;
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
}