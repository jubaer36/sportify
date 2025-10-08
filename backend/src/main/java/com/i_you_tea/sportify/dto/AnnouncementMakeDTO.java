package com.i_you_tea.sportify.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AnnouncementMakeDTO {
    private String title;
    private String content;
    private Long postedByUserId;
    private Long relatedSportId;
    private Long relatedTournamentId;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
}