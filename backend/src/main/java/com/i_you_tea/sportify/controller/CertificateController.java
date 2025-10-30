package com.i_you_tea.sportify.controller;

import com.i_you_tea.sportify.dto.CertificateDTO;
import com.i_you_tea.sportify.entity.Certificate;
import com.i_you_tea.sportify.entity.Sport;
import com.i_you_tea.sportify.entity.Tournament;
import com.i_you_tea.sportify.entity.User;
import com.i_you_tea.sportify.repository.SportRepository;
import com.i_you_tea.sportify.repository.TournamentRepository;
import com.i_you_tea.sportify.repository.UserRepository;
import com.i_you_tea.sportify.service.CertificateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/certificates")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class CertificateController {

    private final CertificateService certificateService;
    private final UserRepository userRepository;
    private final TournamentRepository tournamentRepository;
    private final SportRepository sportRepository;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<CertificateDTO>> getForUser(@PathVariable Long userId) {
        List<CertificateDTO> dtos = certificateService.getByUserId(userId).stream()
                .map(CertificateDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/tournament/{tournamentId}")
    public ResponseEntity<List<CertificateDTO>> getForTournament(@PathVariable Long tournamentId) {
        List<CertificateDTO> dtos = certificateService.getByTournamentId(tournamentId).stream()
                .map(CertificateDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    public static class CreateCertificateRequest {
        public Long userId;
        public Long tournamentId;
        public Long sportId;
        public String position;
        public LocalDate issuedOn;
    }

    @PostMapping
    public ResponseEntity<CertificateDTO> create(@RequestBody CreateCertificateRequest req) {
        Optional<User> user = userRepository.findById(req.userId);
        Optional<Tournament> tournament = tournamentRepository.findById(req.tournamentId);
        Optional<Sport> sport = sportRepository.findById(req.sportId);
        if (user.isEmpty() || tournament.isEmpty() || sport.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        Certificate c = new Certificate();
        c.setUser(user.get());
        c.setTournament(tournament.get());
        c.setSport(sport.get());
        c.setPosition(req.position != null ? req.position : "Participant");
        c.setIssuedOn(req.issuedOn != null ? req.issuedOn : LocalDate.now());
        Certificate saved = certificateService.create(c);
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED).body(CertificateDTO.fromEntity(saved));
    }

    @PostMapping("/generate/{tournamentId}")
    public ResponseEntity<String> generateForTournament(@PathVariable Long tournamentId) {
        int created = certificateService.generateForTournament(tournamentId);
        return ResponseEntity.ok("Certificates created: " + created);
    }
}


