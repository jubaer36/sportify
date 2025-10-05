package com.i_you_tea.sportify.service;

import com.i_you_tea.sportify.Config.JWTService;
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

    public Announcement createAnnouncement(Announcement announcement) {
        return announcementRepository.save(announcement);
    }

    public Announcement makeAnnouncement(
            String title,
            String content,
            Long postedByUserId,
            Long relatedSportId,
            Long relatedTournamentId,
            LocalDateTime startDate,
            LocalDateTime endDate
    ) {
        User postedBy = userRepository.findById(postedByUserId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        Sport relatedSport = null;
        if (relatedSportId != null) {
            relatedSport = sportRepository.findById(relatedSportId).orElse(null);
        }
        Tournament relatedTournament = null;
        if (relatedTournamentId != null) {
            relatedTournament = tournamentRepository.findById(relatedTournamentId).orElse(null);
        }
        Announcement announcement = new Announcement();
        announcement.setTitle(title);
        announcement.setContent(content);
        announcement.setPostedBy(postedBy);
        announcement.setPostedAt(LocalDateTime.now());
        announcement.setRelatedSport(relatedSport);
        announcement.setRelatedTournament(relatedTournament);
        announcement.setStartDate(startDate);
        announcement.setEndDate(endDate);
        return announcementRepository.save(announcement);
    }
}