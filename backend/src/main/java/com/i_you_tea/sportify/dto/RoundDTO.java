package com.i_you_tea.sportify.dto;

import com.i_you_tea.sportify.entity.Round;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoundDTO {
    
    private Long roundId;
    private Integer roundValue;
    private String roundName;
    private Long tournamentId;
    private String tournamentName;
    private Round.TournamentType type;
    
    /**
     * Convert Round entity to RoundDTO
     */
    public static RoundDTO fromEntity(Round round) {
        if (round == null) {
            return null;
        }
        
        RoundDTO dto = new RoundDTO();
        dto.setRoundId(round.getRoundId());
        dto.setRoundValue(round.getRoundValue());
        dto.setRoundName(round.getRoundName());
        dto.setType(round.getType());
        
        // Set tournament information
        if (round.getTournament() != null) {
            dto.setTournamentId(round.getTournament().getTournamentId());
            dto.setTournamentName(round.getTournament().getName());
        }
        
        return dto;
    }
    
    /**
     * Convert RoundDTO to Round entity
     */
    public Round toEntity() {
        Round round = new Round();
        round.setRoundId(this.roundId);
        round.setRoundValue(this.roundValue);
        round.setType(this.type);
        // roundName will be automatically calculated when roundValue is set
        // Tournament relationship should be set by the service layer
        return round;
    }
    

}