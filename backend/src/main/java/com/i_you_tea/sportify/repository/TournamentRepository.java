package com.i_you_tea.sportify.repository;

import com.i_you_tea.sportify.entity.Tournament;
import com.i_you_tea.sportify.entity.Sport;
import com.i_you_tea.sportify.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TournamentRepository extends JpaRepository<Tournament, Long> {
    
    List<Tournament> findBySport(Sport sport);
    
    List<Tournament> findByCreatedBy(User createdBy);
    
    List<Tournament> findByType(Tournament.TournamentType type);
    
    List<Tournament> findByStartDateBetween(LocalDate startDate, LocalDate endDate);
    
    List<Tournament> findByNameContainingIgnoreCase(String name);
}