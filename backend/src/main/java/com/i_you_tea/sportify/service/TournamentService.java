package com.i_you_tea.sportify.service;

import com.i_you_tea.sportify.entity.Tournament;
import com.i_you_tea.sportify.entity.Sport;
import com.i_you_tea.sportify.entity.User;
import com.i_you_tea.sportify.repository.TournamentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TournamentService {
    private final TournamentRepository tournamentRepository;
    
    public List<Tournament> getAllTournaments() {
        return tournamentRepository.findAll();
    }
}