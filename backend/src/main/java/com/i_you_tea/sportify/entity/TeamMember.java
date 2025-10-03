package com.i_you_tea.sportify.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Entity
@Table(name = "team_members")
@Data
@NoArgsConstructor
@AllArgsConstructor
@IdClass(TeamMember.TeamMemberId.class)
public class TeamMember {
    
    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;
    
    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
    
    @Column(name = "role_in_team")
    private String roleInTeam;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private TeamMemberStatus status = TeamMemberStatus.PENDING;
    
    public enum TeamMemberStatus {
        PENDING,
        ACCEPTED
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TeamMemberId implements Serializable {
        private Long team;
        private Long user;
    }
}