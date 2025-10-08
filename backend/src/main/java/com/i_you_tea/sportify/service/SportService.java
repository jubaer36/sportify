package com.i_you_tea.sportify.service;

import com.i_you_tea.sportify.entity.Sport;
import com.i_you_tea.sportify.entity.User;
import com.i_you_tea.sportify.repository.SportRepository;
import com.i_you_tea.sportify.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SportService {
    private final SportRepository sportRepository;
    private final UserRepository userRepository;

    public List<Sport> getAllSports() {
        return sportRepository.findAll();
    }

    public Sport createSport(Sport sport) {
        // If a captain is assigned, validate that the user exists and has CAPTAIN role
        if (sport.getCaptain() != null && sport.getCaptain().getUserId() != null) {
            Optional<User> captainUser = userRepository.findById(sport.getCaptain().getUserId());
            if (captainUser.isPresent() && captainUser.get().getRole() == User.UserRole.CAPTAIN) {
                sport.setCaptain(captainUser.get());
            } else {
                sport.setCaptain(null); // Remove invalid captain assignment
            }
        }
        return sportRepository.save(sport);
    }

    public Optional<Sport> getSportById(Long id) {
        return sportRepository.findById(id);
    }

    public Sport updateSport(Long id, Sport sportUpdate) {
        Optional<Sport> existingSport = sportRepository.findById(id);
        if (existingSport.isPresent()) {
            Sport sport = existingSport.get();
            sport.setName(sportUpdate.getName());
            sport.setIsTeamGame(sportUpdate.getIsTeamGame());
            sport.setRules(sportUpdate.getRules());
            sport.setPlayerCount(sportUpdate.getPlayerCount());

            // Handle captain assignment (allow any user)
            if (sportUpdate.getCaptain() != null && sportUpdate.getCaptain().getUserId() != null) {
                Optional<User> captainUser = userRepository.findById(sportUpdate.getCaptain().getUserId());
                if (captainUser.isPresent()) {
                    sport.setCaptain(captainUser.get());
                } else {
                    sport.setCaptain(null);
                }
            } else {
                sport.setCaptain(null);
            }

            // Note: Recent champion and runner-up are typically updated through tournament completion
            // but we can allow manual updates if needed
            if (sportUpdate.getRecentChampion() != null && sportUpdate.getRecentChampion().getTeamId() != null) {
                // Validate team exists (assuming TeamRepository is available)
                sport.setRecentChampion(sportUpdate.getRecentChampion());
            }

            if (sportUpdate.getRecentRunnerUp() != null && sportUpdate.getRecentRunnerUp().getTeamId() != null) {
                // Validate team exists (assuming TeamRepository is available)
                sport.setRecentRunnerUp(sportUpdate.getRecentRunnerUp());
            }

            return sportRepository.save(sport);
        }
        return null;
    }

    public List<Sport> getSportsByCaptain(Long captainId) {
        return sportRepository.findByCaptainUserId(captainId);
    }

    public boolean deleteSport(Long id) {
        if (sportRepository.existsById(id)) {
            sportRepository.deleteById(id);
            return true;
        }
        return false;
    }
}