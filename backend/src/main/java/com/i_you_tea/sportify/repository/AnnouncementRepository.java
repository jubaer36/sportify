package com.i_you_tea.sportify.repository;

import com.i_you_tea.sportify.entity.Announcement;
import com.i_you_tea.sportify.entity.User;
import com.i_you_tea.sportify.entity.Sport;
import com.i_you_tea.sportify.entity.Tournament;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
    
    List<Announcement> findByPostedBy(User postedBy);
    
    List<Announcement> findByRelatedSport(Sport relatedSport);
    
    List<Announcement> findByRelatedTournament(Tournament relatedTournament);
    
    List<Announcement> findByPostedAtBetween(LocalDateTime start, LocalDateTime end);
    
    List<Announcement> findByTitleContainingIgnoreCase(String title);
    
    List<Announcement> findAllByOrderByPostedAtDesc();
}