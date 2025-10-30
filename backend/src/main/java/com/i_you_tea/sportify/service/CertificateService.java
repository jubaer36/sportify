package com.i_you_tea.sportify.service;

import com.i_you_tea.sportify.entity.*;
import com.i_you_tea.sportify.repository.CertificateRepository;
import com.i_you_tea.sportify.repository.TournamentRepository;
import com.i_you_tea.sportify.repository.UserRepository;
import com.i_you_tea.sportify.repository.TeamRepository;
import com.i_you_tea.sportify.repository.TeamMemberRepository;
import com.i_you_tea.sportify.repository.SportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CertificateService {

    private final CertificateRepository certificateRepository;
    private final UserRepository userRepository;
    private final TournamentRepository tournamentRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final SportRepository sportRepository;

    public List<Certificate> getByUserId(Long userId) {
        Optional<User> user = userRepository.findById(userId);
        return user.map(certificateRepository::findByUser).orElseGet(List::of);
    }

    public List<Certificate> getByTournamentId(Long tournamentId) {
        Optional<Tournament> t = tournamentRepository.findById(tournamentId);
        return t.map(certificateRepository::findByTournament).orElseGet(List::of);
    }

    public Certificate create(Certificate certificate) {
        return certificateRepository.save(certificate);
    }

    public int generateForTournament(Long tournamentId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Tournament not found"));

        Sport sport = tournament.getSport();
        int created = 0;

        // Champion team members
        if (tournament.getChampion() != null) {
            Team champion = tournament.getChampion();
            for (TeamMember tm : teamMemberRepository.findByTeam(champion)) {
                created += saveIfNotExists(tm.getUser(), tournament, sport, "Champion");
            }
        }

        // Runner-up team members
        if (tournament.getRunnerUp() != null) {
            Team runner = tournament.getRunnerUp();
            for (TeamMember tm : teamMemberRepository.findByTeam(runner)) {
                created += saveIfNotExists(tm.getUser(), tournament, sport, "Runner-up");
            }
        }

        // Optional: participants (all teams' members)
        for (Team team : teamRepository.findByTournament(tournament)) {
            for (TeamMember tm : teamMemberRepository.findByTeam(team)) {
                // Do not downgrade Champion/Runner-up certs; only create Participant if none exists
                created += saveIfNotExists(tm.getUser(), tournament, sport, "Participant");
            }
        }

        return created;
    }

    private int saveIfNotExists(User user, Tournament tournament, Sport sport, String position) {
        // naive existence check: any certificate for user+tournament
        boolean already = certificateRepository.findByUser(user).stream()
                .anyMatch(c -> c.getTournament().getTournamentId().equals(tournament.getTournamentId()));
        if (already) return 0;
        Certificate c = new Certificate();
        c.setUser(user);
        c.setTournament(tournament);
        c.setSport(sport);
        c.setPosition(position);
        certificateRepository.save(c);
        return 1;
    }
}


