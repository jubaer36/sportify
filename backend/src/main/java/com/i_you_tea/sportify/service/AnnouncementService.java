package com.i_you_tea.sportify.service;

import com.i_you_tea.sportify.Config.JWTService;
import com.i_you_tea.sportify.dto.CreateAnnouncementDTO;
import com.i_you_tea.sportify.entity.Announcement;
import com.i_you_tea.sportify.entity.User;
import com.i_you_tea.sportify.entity.Sport;
import com.i_you_tea.sportify.entity.Tournament;
import com.i_you_tea.sportify.repository.AnnouncementRepository;
import com.i_you_tea.sportify.repository.UserRepository;
import com.i_you_tea.sportify.repository.SportRepository;
import com.i_you_tea.sportify.repository.TournamentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AnnouncementService {
    private final AnnouncementRepository announcementRepository;
    private final UserRepository userRepository;
    private final SportRepository sportRepository;
    private final TournamentRepository tournamentRepository;
    private final JWTService jwtService;
    
    public List<Announcement> getAllAnnouncements() {
        return announcementRepository.findAll();
    }

    public Announcement createAnnouncement(CreateAnnouncementDTO createAnnouncementDTO, String token) {
        // Extract username from JWT token
        String username = jwtService.extractUserName(token);
        
        // Find user by username
        Optional<User> userOptional = userRepository.findByUserName(username);
        if (userOptional.isEmpty()) {
            throw new RuntimeException("User not found");
        }
        
        User user = userOptional.get();
        
        // Validate date constraints
        if (createAnnouncementDTO.getStartDate() != null && createAnnouncementDTO.getEndDate() != null) {
            if (createAnnouncementDTO.getStartDate().isAfter(createAnnouncementDTO.getEndDate())) {
                throw new RuntimeException("Start date cannot be after end date");
            }
        }
        
        // Create announcement entity
        Announcement announcement = new Announcement();
        announcement.setTitle(createAnnouncementDTO.getTitle());
        announcement.setContent(createAnnouncementDTO.getContent());
        announcement.setPostedBy(user);
        announcement.setPostedAt(LocalDateTime.now());
        announcement.setStartDate(createAnnouncementDTO.getStartDate());
        announcement.setEndDate(createAnnouncementDTO.getEndDate());
        
        // Set related sport if provided
        if (createAnnouncementDTO.getRelatedSportId() != null) {
            Optional<Sport> sportOptional = sportRepository.findById(createAnnouncementDTO.getRelatedSportId());
            if (sportOptional.isPresent()) {
                announcement.setRelatedSport(sportOptional.get());
            } else {
                throw new RuntimeException("Sport not found");
            }
        }
        
        // Set related tournament if provided
        if (createAnnouncementDTO.getRelatedTournamentId() != null) {
            Optional<Tournament> tournamentOptional = tournamentRepository.findById(createAnnouncementDTO.getRelatedTournamentId());
            if (tournamentOptional.isPresent()) {
                announcement.setRelatedTournament(tournamentOptional.get());
            } else {
                throw new RuntimeException("Tournament not found");
            }
        }
        
        return announcementRepository.save(announcement);
    }

    public Announcement createAnnouncement(Announcement announcement) {
        return announcementRepository.save(announcement);
    }
}