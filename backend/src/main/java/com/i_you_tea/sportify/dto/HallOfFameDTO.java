package com.i_you_tea.sportify.dto;

import com.i_you_tea.sportify.entity.HallOfFame;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HallOfFameDTO {
    
    private Long hofId;
    private Long userId;
    private String userName;
    private Long sportId;
    private String sportName;
    private String title;
    private String stats;
    private String photo;
    private Long matchId;
    private String matchInfo;
    private Long tournamentId;
    private String tournamentName;
    
    public static HallOfFameDTO fromEntity(HallOfFame hallOfFame) {
        return new HallOfFameDTO(
            hallOfFame.getHofId(),
            hallOfFame.getUser() != null ? hallOfFame.getUser().getUserId() : null,
            hallOfFame.getUser() != null ? hallOfFame.getUser().getName() : null,
            hallOfFame.getSport() != null ? hallOfFame.getSport().getSportId() : null,
            hallOfFame.getSport() != null ? hallOfFame.getSport().getName() : null,
            hallOfFame.getTitle(),
            hallOfFame.getStats(),
            hallOfFame.getPhoto(),
            hallOfFame.getMatch() != null ? hallOfFame.getMatch().getMatchId() : null,
            hallOfFame.getMatch() != null ? (hallOfFame.getMatch().getTeam1().getTeamName() + " vs " + hallOfFame.getMatch().getTeam2().getTeamName()) : null,
            hallOfFame.getTournament() != null ? hallOfFame.getTournament().getTournamentId() : null,
            hallOfFame.getTournament() != null ? hallOfFame.getTournament().getName() : null
        );
    }
}