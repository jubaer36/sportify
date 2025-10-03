package com.i_you_tea.sportify.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateAnnouncementDTO {
    
    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 255, message = "Title must be between 3 and 255 characters")
    private String title;
    
    @NotBlank(message = "Content is required")
    @Size(min = 10, max = 5000, message = "Content must be between 10 and 5000 characters")
    private String content;
    
    @Positive(message = "Related sport ID must be a positive number")
    private Long relatedSportId;
    
    @Positive(message = "Related tournament ID must be a positive number")
    private Long relatedTournamentId;
    
    private LocalDateTime startDate;
    
    private LocalDateTime endDate;
}