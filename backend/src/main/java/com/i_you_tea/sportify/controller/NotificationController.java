package com.i_you_tea.sportify.controller;

import com.i_you_tea.sportify.dto.NotificationDTO;
import com.i_you_tea.sportify.entity.Notification;
import com.i_you_tea.sportify.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {
    @Autowired
    private NotificationService notificationService;
    
    @GetMapping
    public ResponseEntity<List<NotificationDTO>> getAllNotifications() {
        List<Notification> notifications = notificationService.getAllNotifications();
        List<NotificationDTO> notificationDTOs = notifications.stream()
                .map(NotificationDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(notificationDTOs);
    }

    @PostMapping
    public ResponseEntity<NotificationDTO> createNotification(@RequestBody Notification notification) {
        Notification created = notificationService.createNotification(notification);
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED).body(NotificationDTO.fromEntity(created));
    }
}