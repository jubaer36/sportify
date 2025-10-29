package com.i_you_tea.sportify.repository;

import com.i_you_tea.sportify.entity.Certificate;
import com.i_you_tea.sportify.entity.Tournament;
import com.i_you_tea.sportify.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CertificateRepository extends JpaRepository<Certificate, Long> {
    List<Certificate> findByUser(User user);
    List<Certificate> findByTournament(Tournament tournament);
}


