package com.i_you_tea.sportify.service;

import com.i_you_tea.sportify.entity.Sport;
import com.i_you_tea.sportify.repository.SportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SportService {
    private final SportRepository sportRepository;

    public List<Sport> getAllSports() {
        return sportRepository.findAll();
    }
}