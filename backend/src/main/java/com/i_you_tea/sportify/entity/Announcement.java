package com.i_you_tea.sportify.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "announcements")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Announcement {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "announcement_id")
    private Long announcementId;
    
    @Column(name = "title", nullable = false)
    private String title;
    
    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "posted_by", nullable = false)
    private User postedBy;
    
    @Column(name = "posted_at", nullable = false)
    private LocalDateTime postedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_sport_id")
    private Sport relatedSport;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_tournament_id")
    private Tournament relatedTournament;
    
    @Column(name = "start_date")
    private LocalDateTime startDate;
    
    @Column(name = "end_date")
    private LocalDateTime endDate;
}