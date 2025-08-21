package com.i_you_tea.sportify.repository;

import com.i_you_tea.sportify.entity.Notification;
import com.i_you_tea.sportify.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    List<Notification> findByRecipient(User recipient);
    
    List<Notification> findByRecipientAndIsRead(User recipient, Boolean isRead);
    
    List<Notification> findBySentAtBetween(LocalDateTime start, LocalDateTime end);
    
    List<Notification> findByRecipientOrderBySentAtDesc(User recipient);
    
    long countByRecipientAndIsRead(User recipient, Boolean isRead);
}