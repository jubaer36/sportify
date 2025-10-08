package com.i_you_tea.sportify.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateDummyTeamDTO {
    @NotBlank(message = "Team name is required")
    private String teamName;

    @NotNull(message = "Sport ID is required")
    private Long sportId;

    @NotNull(message = "Tournament ID is required")
    private Long tournamentId;

    @NotNull(message = "Created by user ID is required")
    private Long createdById;
}
