package com.example.minidiscord.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MentionNotificationDTO {
    private String id;
    private String userId;
    private String serverId;
    private String channelId;
    private String messageId;
    private String senderId;
    private String senderName;
    private String senderAvatar;
    private String preview;
    private boolean read;
    private LocalDateTime createdAt;
    private LocalDateTime readAt;
}
