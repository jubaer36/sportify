package com.i_you_tea.sportify.service;

import com.i_you_tea.sportify.entity.Tournament;
import com.i_you_tea.sportify.entity.Sport;
import com.i_you_tea.sportify.entity.Team;
import com.i_you_tea.sportify.entity.User;
import com.i_you_tea.sportify.repository.TournamentRepository;
import com.i_you_tea.sportify.repository.TeamRepository;
import com.i_you_tea.sportify.repository.SportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TournamentService {
    private final TournamentRepository tournamentRepository;
    private final TeamRepository teamRepository;
    private final SportRepository sportRepository;
    
    public List<Tournament> getAllTournaments() {
        return tournamentRepository.findAll();
    }

    public Tournament createTournament(Tournament tournament) {
        // Validate champion and runner-up if provided
        if (tournament.getChampion() != null && tournament.getChampion().getTeamId() != null) {
            Optional<Team> championTeam = teamRepository.findById(tournament.getChampion().getTeamId());
            if (championTeam.isPresent()) {
                tournament.setChampion(championTeam.get());
            } else {
                tournament.setChampion(null);
            }
        }
        
        if (tournament.getRunnerUp() != null && tournament.getRunnerUp().getTeamId() != null) {
            Optional<Team> runnerUpTeam = teamRepository.findById(tournament.getRunnerUp().getTeamId());
            if (runnerUpTeam.isPresent()) {
                tournament.setRunnerUp(runnerUpTeam.get());
            } else {
                tournament.setRunnerUp(null);
            }
        }
        
        Tournament savedTournament = tournamentRepository.save(tournament);
        
        // Update sport's recent champion and runner-up if this tournament has results
        if (savedTournament.getChampion() != null && savedTournament.getSport() != null) {
            updateSportRecentResults(savedTournament);
        }
        
        return savedTournament;
    }
    
    public Optional<Tournament> getTournamentById(Long id) {
        return tournamentRepository.findById(id);
    }
    
    public Tournament updateTournament(Long id, Tournament tournamentUpdate) {
        Optional<Tournament> existingTournament = tournamentRepository.findById(id);
        if (existingTournament.isPresent()) {
            Tournament tournament = existingTournament.get();
            tournament.setName(tournamentUpdate.getName());
            tournament.setStartDate(tournamentUpdate.getStartDate());
            tournament.setEndDate(tournamentUpdate.getEndDate());
            
            // Handle champion and runner-up updates
            if (tournamentUpdate.getChampion() != null && tournamentUpdate.getChampion().getTeamId() != null) {
                Optional<Team> championTeam = teamRepository.findById(tournamentUpdate.getChampion().getTeamId());
                if (championTeam.isPresent()) {
                    tournament.setChampion(championTeam.get());
                } else {
                    tournament.setChampion(null);
                }
            } else {
                tournament.setChampion(null);
            }
            
            if (tournamentUpdate.getRunnerUp() != null && tournamentUpdate.getRunnerUp().getTeamId() != null) {
                Optional<Team> runnerUpTeam = teamRepository.findById(tournamentUpdate.getRunnerUp().getTeamId());
                if (runnerUpTeam.isPresent()) {
                    tournament.setRunnerUp(runnerUpTeam.get());
                } else {
                    tournament.setRunnerUp(null);
                }
            } else {
                tournament.setRunnerUp(null);
            }
            
            Tournament savedTournament = tournamentRepository.save(tournament);
            
            // Update sport's recent results if championship info changed
            if (savedTournament.getChampion() != null && savedTournament.getSport() != null) {
                updateSportRecentResults(savedTournament);
            }
            
            return savedTournament;
        }
        return null;
    }
    
    public List<Tournament> getTournamentsBySport(Long sportId) {
        Sport sport = new Sport();
        sport.setSportId(sportId);
        return tournamentRepository.findBySport(sport);
    }
    
    public boolean deleteTournament(Long id) {
        if (tournamentRepository.existsById(id)) {
            tournamentRepository.deleteById(id);
            return true;
        }
        return false;
    }
    
    public List<Tournament> getTournamentsByUserId(Long userId) {
        return tournamentRepository.findTournamentsByUserId(userId);
    }
    
    private void updateSportRecentResults(Tournament tournament) {
        Optional<Sport> sportOpt = sportRepository.findById(tournament.getSport().getSportId());
        if (sportOpt.isPresent()) {
            Sport sport = sportOpt.get();
            sport.setRecentChampion(tournament.getChampion());
            sport.setRecentRunnerUp(tournament.getRunnerUp());
            sportRepository.save(sport);
        }
    }
}