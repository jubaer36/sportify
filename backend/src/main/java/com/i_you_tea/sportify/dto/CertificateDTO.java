package com.i_you_tea.sportify.dto;

import com.i_you_tea.sportify.entity.Certificate;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CertificateDTO {

    private Long certificateId;
    private Long userId;
    private String userName;
    private Long tournamentId;
    private String tournamentName;
    private Long sportId;
    private String sportName;
    private String position;
    private LocalDate issuedOn;

    public static CertificateDTO fromEntity(Certificate c) {
        return new CertificateDTO(
                c.getCertificateId(),
                c.getUser() != null ? c.getUser().getUserId() : null,
                c.getUser() != null ? c.getUser().getName() : null,
                c.getTournament() != null ? c.getTournament().getTournamentId() : null,
                c.getTournament() != null ? c.getTournament().getName() : null,
                c.getSport() != null ? c.getSport().getSportId() : null,
                c.getSport() != null ? c.getSport().getName() : null,
                c.getPosition(),
                c.getIssuedOn()
        );
    }
}


