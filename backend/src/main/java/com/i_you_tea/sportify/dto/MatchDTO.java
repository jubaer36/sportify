package com.i_you_tea.sportify.dto;

import com.i_you_tea.sportify.entity.Match;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatchDTO {
    
    private Long matchId;
    private Long tournamentId;
    private String tournamentName;
    private Long sportId;
    private String sportName;
    private Long team1Id;
    private String team1Name;
    private Long team2Id;
    private String team2Name;
    private LocalDateTime scheduledTime;
    private String venue;
    private Match.MatchStatus status;
    private Long winnerTeamId;
    private String winnerTeamName;
    private Long roundId;
    private String roundName;
    private Integer roundValue;
    
    public static MatchDTO fromEntity(Match match) {
        return new MatchDTO(
            match.getMatchId(),
            match.getTournament() != null ? match.getTournament().getTournamentId() : null,
            match.getTournament() != null ? match.getTournament().getName() : null,
            match.getSport() != null ? match.getSport().getSportId() : null,
            match.getSport() != null ? match.getSport().getName() : null,
            match.getTeam1() != null ? match.getTeam1().getTeamId() : null,
            match.getTeam1() != null ? match.getTeam1().getTeamName() : null,
            match.getTeam2() != null ? match.getTeam2().getTeamId() : null,
            match.getTeam2() != null ? match.getTeam2().getTeamName() : null,
            match.getScheduledTime(),
            match.getVenue(),
            match.getStatus(),
            match.getWinnerTeam() != null ? match.getWinnerTeam().getTeamId() : null,
            match.getWinnerTeam() != null ? match.getWinnerTeam().getTeamName() : null,
            match.getRound() != null ? match.getRound().getRoundId() : null,
            match.getRound() != null ? match.getRound().getRoundName() : null,
            match.getRound() != null ? match.getRound().getRoundValue() : null
        );
    }
    
    public Match toEntity() {
        Match match = new Match();
        match.setMatchId(this.matchId);
        match.setScheduledTime(this.scheduledTime);
        match.setVenue(this.venue);
        match.setStatus(this.status);
        // Tournament, Sport, Teams, WinnerTeam, and Round relationships should be set by the service layer
        return match;
    }
}