package com.i_you_tea.sportify.service;

import com.i_you_tea.sportify.dto.CricketScoreDTO;
import com.i_you_tea.sportify.entity.CricketScore;
import com.i_you_tea.sportify.entity.Match;
import com.i_you_tea.sportify.exception.ResourceNotFoundException;
import com.i_you_tea.sportify.repository.CricketScoreRepository;
import com.i_you_tea.sportify.repository.MatchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import java.util.List;
import java.util.stream.Collectors;

public interface CricketScoreService {
    CricketScoreDTO create(CricketScoreDTO dto);
    CricketScoreDTO update(Long id, CricketScoreDTO dto);
    CricketScoreDTO findById(Long id);
    List<CricketScoreDTO> findAll();
    List<CricketScoreDTO> findByMatchId(Long matchId);
    void delete(Long id);
}

@Service
@RequiredArgsConstructor
@Transactional
class CricketScoreServiceImpl implements CricketScoreService {

    private final CricketScoreRepository cricketScoreRepository;
    private final MatchRepository matchRepository;

    @Override
    public CricketScoreDTO create(CricketScoreDTO dto) {
        CricketScore entity = dto.toEntity();
        Match match = matchRepository.findById(dto.getMatchId())
                .orElseThrow(() -> new ResourceNotFoundException("Match not found with id " + dto.getMatchId()));
        entity.setMatch(match);

        CricketScore saved = cricketScoreRepository.save(entity);
        return CricketScoreDTO.fromEntity(saved);
    }

    @Override
    public CricketScoreDTO update(Long id, CricketScoreDTO dto) {
        CricketScore existing = cricketScoreRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CricketScore not found with id " + id));

        if (dto.getMatchId() != null) {
            Match match = matchRepository.findById(dto.getMatchId())
                    .orElseThrow(() -> new ResourceNotFoundException("Match not found with id " + dto.getMatchId()));
            existing.setMatch(match);
        }

        existing.setTeamAId(dto.getTeamAId());
        existing.setTeamBId(dto.getTeamBId());
        existing.setTeamAInnings(dto.getTeamAInnings());
        existing.setTeamBInnings(dto.getTeamBInnings());
        existing.setTeamATotalRun(dto.getTeamATotalRun());
        existing.setTeamBTotalRun(dto.getTeamBTotalRun());
        existing.setTeamATotalWicket(dto.getTeamATotalWicket());
        existing.setTeamBTotalWicket(dto.getTeamBTotalWicket());
        existing.setTeamAOvers(dto.getTeamAOvers());
        existing.setTeamBOvers(dto.getTeamBOvers());

        CricketScore saved = cricketScoreRepository.save(existing);
        return CricketScoreDTO.fromEntity(saved);
    }

    @Override
    public CricketScoreDTO findById(Long id) {
        CricketScore cs = cricketScoreRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CricketScore not found with id " + id));
        return CricketScoreDTO.fromEntity(cs);
    }

    @Override
    public List<CricketScoreDTO> findAll() {
        return cricketScoreRepository.findAll().stream()
                .map(CricketScoreDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public List<CricketScoreDTO> findByMatchId(Long matchId) {
        return cricketScoreRepository.findByMatch_MatchId(matchId).stream()
                .map(CricketScoreDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public void delete(Long id) {
        if (!cricketScoreRepository.existsById(id)) {
            throw new ResourceNotFoundException("CricketScore not found with id " + id);
        }
        cricketScoreRepository.deleteById(id);
    }
}
