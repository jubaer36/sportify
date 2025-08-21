package com.i_you_tea.sportify.repository;

import com.i_you_tea.sportify.entity.HallOfFame;
import com.i_you_tea.sportify.entity.User;
import com.i_you_tea.sportify.entity.Sport;
import com.i_you_tea.sportify.entity.Match;
import com.i_you_tea.sportify.entity.Tournament;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HallOfFameRepository extends JpaRepository<HallOfFame, Long> {
    
    List<HallOfFame> findByUser(User user);
    
    List<HallOfFame> findBySport(Sport sport);
    
    List<HallOfFame> findByMatch(Match match);
    
    List<HallOfFame> findByTournament(Tournament tournament);
    
    List<HallOfFame> findByTitle(String title);
    
    List<HallOfFame> findByUserAndSport(User user, Sport sport);
}