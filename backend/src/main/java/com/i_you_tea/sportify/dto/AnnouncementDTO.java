package com.i_you_tea.sportify.dto;

import com.i_you_tea.sportify.entity.Announcement;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnnouncementDTO {
    
    private Long announcementId;
    private String title;
    private String content;
    private Long postedById;
    private String postedByName;
    private LocalDateTime postedAt;
    private Long relatedSportId;
    private String relatedSportName;
    private Long relatedTournamentId;
    private String relatedTournamentName;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    
    public static AnnouncementDTO fromEntity(Announcement announcement) {
        return new AnnouncementDTO(
            announcement.getAnnouncementId(),
            announcement.getTitle(),
            announcement.getContent(),
            announcement.getPostedBy() != null ? announcement.getPostedBy().getUserId() : null,
            announcement.getPostedBy() != null ? announcement.getPostedBy().getName() : null,
            announcement.getPostedAt(),
            announcement.getRelatedSport() != null ? announcement.getRelatedSport().getSportId() : null,
            announcement.getRelatedSport() != null ? announcement.getRelatedSport().getName() : null,
            announcement.getRelatedTournament() != null ? announcement.getRelatedTournament().getTournamentId() : null,
            announcement.getRelatedTournament() != null ? announcement.getRelatedTournament().getName() : null,
            announcement.getStartDate(),
            announcement.getEndDate()
        );
    }
}