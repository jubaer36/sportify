package com.i_you_tea.sportify.controller;

import com.i_you_tea.sportify.dto.AnnouncementDTO;
import com.i_you_tea.sportify.dto.CreateAnnouncementDTO;
import com.i_you_tea.sportify.entity.Announcement;
import com.i_you_tea.sportify.service.AnnouncementService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/announcements")
@CrossOrigin(origins = "*")
public class AnnouncementController {
    @Autowired
    private AnnouncementService announcementService;

    @GetMapping
    public ResponseEntity<List<AnnouncementDTO>> getAllAnnouncements(@RequestHeader("Authorization") String token) {
        token = token.replace("Bearer ", "");
        List<Announcement> announcements = announcementService.getAllAnnouncements();
        List<AnnouncementDTO> announcementDTOs = announcements.stream()
                .map(AnnouncementDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(announcementDTOs);
    }

    @PostMapping
    public ResponseEntity<AnnouncementDTO> createAnnouncement(
            @Valid @RequestBody CreateAnnouncementDTO createAnnouncementDTO,
            @RequestHeader("Authorization") String token) {
        // Remove "Bearer " prefix from token
        token = token.replace("Bearer ", "");
        
        Announcement created = announcementService.createAnnouncement(createAnnouncementDTO, token);
        AnnouncementDTO responseDTO = AnnouncementDTO.fromEntity(created);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(responseDTO);
    }

    // Keep the old method for backward compatibility if needed
    @PostMapping("/direct")
    public ResponseEntity<AnnouncementDTO> createAnnouncementDirect(@RequestBody Announcement announcement) {
        Announcement created = announcementService.createAnnouncement(announcement);
        return ResponseEntity.status(HttpStatus.CREATED).body(AnnouncementDTO.fromEntity(created));
    }
}