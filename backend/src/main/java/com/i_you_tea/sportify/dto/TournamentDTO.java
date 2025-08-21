package com.i_you_tea.sportify.dto;

import com.i_you_tea.sportify.entity.Tournament;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TournamentDTO {
    
    private Long tournamentId;
    private String name;
    private Long sportId;
    private String sportName;
    private Tournament.TournamentType type;
    private LocalDate startDate;
    private LocalDate endDate;
    private Long createdById;
    private String createdByName;
    
    public static TournamentDTO fromEntity(Tournament tournament) {
        return new TournamentDTO(
            tournament.getTournamentId(),
            tournament.getName(),
            tournament.getSport() != null ? tournament.getSport().getSportId() : null,
            tournament.getSport() != null ? tournament.getSport().getName() : null,
            tournament.getType(),
            tournament.getStartDate(),
            tournament.getEndDate(),
            tournament.getCreatedBy() != null ? tournament.getCreatedBy().getUserId() : null,
            tournament.getCreatedBy() != null ? tournament.getCreatedBy().getName() : null
        );
    }
}