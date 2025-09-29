package com.i_you_tea.sportify.controller;

import com.i_you_tea.sportify.dto.AnnouncementDTO;
import com.i_you_tea.sportify.entity.Announcement;
import com.i_you_tea.sportify.service.AnnouncementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/announcements")
@CrossOrigin(origins = "*")
public class AnnouncementController {
    @Autowired
    private AnnouncementService announcementService;
    @GetMapping
    public ResponseEntity<List<AnnouncementDTO>> getAllAnnouncements() {
        List<Announcement> announcements = announcementService.getAllAnnouncements();
        List<AnnouncementDTO> announcementDTOs = announcements.stream()
                .map(AnnouncementDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(announcementDTOs);
    }

    @PostMapping
    public ResponseEntity<AnnouncementDTO> createAnnouncement(@RequestBody Announcement announcement) {
        Announcement created = announcementService.createAnnouncement(announcement);
        return ResponseEntity.status(HttpStatus.CREATED).body(AnnouncementDTO.fromEntity(created));
    }
}