package com.i_you_tea.sportify.repository;

import com.i_you_tea.sportify.entity.TeamMember;
import com.i_you_tea.sportify.entity.Team;
import com.i_you_tea.sportify.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeamMemberRepository extends JpaRepository<TeamMember, TeamMember.TeamMemberId> {
    
    List<TeamMember> findByTeam(Team team);
    
    List<TeamMember> findByUser(User user);
    
    List<TeamMember> findByRoleInTeam(String roleInTeam);
    
    boolean existsByTeamAndUser(Team team, User user);
}