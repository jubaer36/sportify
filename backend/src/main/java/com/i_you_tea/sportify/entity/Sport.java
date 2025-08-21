package com.i_you_tea.sportify.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "sports")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Sport {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "sport_id")
    private Long sportId;
    
    @Column(name = "name", nullable = false)
    private String name;
    
    @Column(name = "is_team_game", nullable = false)
    private Boolean isTeamGame;
    
    @Column(name = "rules", columnDefinition = "TEXT")
    private String rules;
}