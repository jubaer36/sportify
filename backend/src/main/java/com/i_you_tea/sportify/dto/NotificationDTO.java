package com.i_you_tea.sportify.dto;

import com.i_you_tea.sportify.entity.Notification;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    
    private Long notificationId;
    private Long recipientId;
    private String recipientName;
    private String message;
    private LocalDateTime sentAt;
    private Boolean isRead;
    
    public static NotificationDTO fromEntity(Notification notification) {
        return new NotificationDTO(
            notification.getNotificationId(),
            notification.getRecipient() != null ? notification.getRecipient().getUserId() : null,
            notification.getRecipient() != null ? notification.getRecipient().getName() : null,
            notification.getMessage(),
            notification.getSentAt(),
            notification.getIsRead()
        );
    }
}