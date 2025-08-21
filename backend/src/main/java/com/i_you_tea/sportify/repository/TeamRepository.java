package com.i_you_tea.sportify.repository;

import com.i_you_tea.sportify.entity.Team;
import com.i_you_tea.sportify.entity.Sport;
import com.i_you_tea.sportify.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {
    
    List<Team> findBySport(Sport sport);
    
    List<Team> findByCreatedBy(User createdBy);
    
    List<Team> findByTeamNameContainingIgnoreCase(String teamName);
}