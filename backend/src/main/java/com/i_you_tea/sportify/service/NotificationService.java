package com.i_you_tea.sportify.service;

import com.i_you_tea.sportify.entity.Notification;
import com.i_you_tea.sportify.entity.User;
import com.i_you_tea.sportify.repository.NotificationRepository;
import com.i_you_tea.sportify.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class NotificationService {
    
    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;
    
    public List<Notification> getAllNotifications() {
        return notificationRepository.findAll();
    }

    public Notification createNotification(Notification notification) {
        return notificationRepository.save(notification);
    }

    public List<Notification> getNotificationsForUser(Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            return notificationRepository.findByRecipientOrderBySentAtDesc(userOpt.get());
        }
        return List.of();
    }

    public Notification markAsRead(Long notificationId) {
        Optional<Notification> notificationOpt = notificationRepository.findById(notificationId);
        if (notificationOpt.isPresent()) {
            Notification notification = notificationOpt.get();
            if (!notification.getIsRead()) {
                notification.setIsRead(true);
                notificationRepository.save(notification);
            }
            return notification;
        }
        return null;
    }
}