package com.i_you_tea.sportify.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Table(name = "rounds")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Round {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "round_id")
    private Long roundId;
    
    @Column(name = "round_value", nullable = false)
    private Integer roundValue;
    
    @Column(name = "round_name", nullable = false)
    private String roundName;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tournament_id", nullable = false)
    private Tournament tournament;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = true)
    private TournamentType type;
    
    @OneToMany(mappedBy = "round", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Match> matches;
    
    /**
     * Constructor that automatically calculates round name based on round value
     * @param roundValue The power value (1 = Final, 2 = Semi-final, etc.)
     * @param tournament The tournament this round belongs to
     * @param type The tournament type (ROUND_ROBIN or KNOCKOUT)
     */
    public Round(Integer roundValue, Tournament tournament, TournamentType type) {
        this.roundValue = roundValue;
        this.roundName = calculateRoundName(roundValue);
        this.tournament = tournament;
        this.type = type;
    }
    
    /**
     * Constructor that automatically calculates round name based on round value
     * @param roundValue The power value (1 = Final, 2 = Semi-final, etc.)
     * @param tournament The tournament this round belongs to
     * @deprecated Use Round(Integer roundValue, Tournament tournament, TournamentType type) instead
     */
    @Deprecated
    public Round(Integer roundValue, Tournament tournament) {
        this.roundValue = roundValue;
        this.roundName = calculateRoundName(roundValue);
        this.tournament = tournament;
        this.type = TournamentType.KNOCKOUT; // Default to KNOCKOUT for backward compatibility
    }
    
    /**
     * Constructor that automatically calculates round name based on round value (without tournament)
     * @param roundValue The power value (1 = Final, 2 = Semi-final, etc.)
     * @deprecated Use Round(Integer roundValue, Tournament tournament) instead
     */
    @Deprecated
    public Round(Integer roundValue) {
        this.roundValue = roundValue;
        this.roundName = calculateRoundName(roundValue);
    }
    
    /**
     * Calculates the round name based on the round value
     * @param roundValue The power value
     * @return The calculated round name
     */
    public static String calculateRoundName(Integer roundValue) {
        if (roundValue == null || roundValue < 1) {
            return "Invalid Round";
        }
        
        switch (roundValue) {
            case 1:
                return "Final";
            case 2:
                return "Semi-final";
            case 3:
                return "Quarter-final";
            case 4:
                return "Round of 16";
            case 5:
                return "Round of 32";
            case 6:
                return "Round of 64";
            case 7:
                return "Round of 128";
            default:
                int numberOfTeams = (int) Math.pow(2, roundValue);
                return "Round of " + numberOfTeams;
        }
    }
    
    /**
     * Sets the round value and automatically updates the round name
     * @param roundValue The power value
     */
    public void setRoundValue(Integer roundValue) {
        this.roundValue = roundValue;
        this.roundName = calculateRoundName(roundValue);
    }
    
    /**
     * Gets the number of teams that should participate in this round
     * @return The number of teams (2^roundValue)
     */
    public Integer getNumberOfTeams() {
        return (int) Math.pow(2, roundValue);
    }
    
    public enum TournamentType {
        ROUND_ROBIN, KNOCKOUT
    }
}