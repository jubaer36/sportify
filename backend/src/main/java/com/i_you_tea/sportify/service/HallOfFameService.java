package com.i_you_tea.sportify.service;

import com.i_you_tea.sportify.entity.HallOfFame;
import com.i_you_tea.sportify.entity.User;
import com.i_you_tea.sportify.entity.Sport;
import com.i_you_tea.sportify.entity.Match;
import com.i_you_tea.sportify.entity.Tournament;
import com.i_you_tea.sportify.repository.HallOfFameRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class HallOfFameService {
    
    private final HallOfFameRepository hallOfFameRepository;
    
    public List<HallOfFame> getAllHallOfFameEntries() {
        return hallOfFameRepository.findAll();
    }
}