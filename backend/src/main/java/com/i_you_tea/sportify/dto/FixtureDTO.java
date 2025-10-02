package com.i_you_tea.sportify.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.i_you_tea.sportify.entity.Round;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FixtureDTO {

    private Long tournamentId;
    private String tournamentName;
    private String sportName;
    private List<RoundFixtureDTO> rounds;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoundFixtureDTO {
        private Long roundId;
        private Integer roundValue;
        private String roundName;
        private Round.TournamentType type;
        private List<MatchDTO> matches;
    }
}