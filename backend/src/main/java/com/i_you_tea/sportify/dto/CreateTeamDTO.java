package com.i_you_tea.sportify.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateTeamDTO {
    
    @NotBlank(message = "Team name is required")
    @Size(min = 2, max = 100, message = "Team name must be between 2 and 100 characters")
    private String teamName;
    
    @NotNull(message = "Sport ID is required")
    private Long sportId;
    
    @NotNull(message = "Created by user ID is required")
    private Long createdById;
    
    private Long tournamentId; // Optional - can be null
    
    private String logo; // Optional - can be null
}