package com.i_you_tea.sportify.service;

import com.i_you_tea.sportify.dto.CricketScoreDTO;
import com.i_you_tea.sportify.entity.CricketScore;
import com.i_you_tea.sportify.repository.CricketScoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CricketScoreService {

    private final CricketScoreRepository cricketScoreRepository;

    /**
     * Create a new cricket score
     */
    public CricketScoreDTO create(CricketScoreDTO dto) {
        CricketScore cricketScore = dto.toEntity();
        CricketScore saved = cricketScoreRepository.save(cricketScore);
        return CricketScoreDTO.fromEntity(saved);
    }

    /**
     * Find all cricket scores
     */
    @Transactional(readOnly = true)
    public List<CricketScoreDTO> findAll() {
        return cricketScoreRepository.findAll()
                .stream()
                .map(CricketScoreDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Find cricket score by ID
     */
    @Transactional(readOnly = true)
    public CricketScoreDTO findById(Long id) {
        CricketScore cricketScore = cricketScoreRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cricket score not found with id: " + id));
        return CricketScoreDTO.fromEntity(cricketScore);
    }

    /**
     * Find cricket scores by match ID
     */
    @Transactional(readOnly = true)
    public List<CricketScoreDTO> findByMatchId(Long matchId) {
        return cricketScoreRepository.findByMatchId(matchId)
                .stream()
                .map(CricketScoreDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Update an existing cricket score
     */
    public CricketScoreDTO update(Long id, CricketScoreDTO dto) {
        CricketScore existingScore = cricketScoreRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cricket score not found with id: " + id));

        // Update fields
        existingScore.setMatchId(dto.getMatchId());
        existingScore.setTeamId(dto.getTeamId());
        existingScore.setRuns(dto.getRuns());
        existingScore.setWickets(dto.getWickets());
        existingScore.setOvers(dto.getOvers());

        CricketScore updated = cricketScoreRepository.save(existingScore);
        return CricketScoreDTO.fromEntity(updated);
    }

    /**
     * Delete a cricket score by ID
     */
    public void delete(Long id) {
        if (!cricketScoreRepository.existsById(id)) {
            throw new RuntimeException("Cricket score not found with id: " + id);
        }
        cricketScoreRepository.deleteById(id);
    }
}