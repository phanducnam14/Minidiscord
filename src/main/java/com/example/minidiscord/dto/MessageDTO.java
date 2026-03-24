package com.example.minidiscord.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MessageDTO {
    private String id;
    private String channelId;
    private String senderId;
    private String senderName;
    private String senderAvatar;
    private String content;
    private String type;      // TEXT, IMAGE, FILE
    private String fileUrl;
    private String fileName;
    private boolean revoked;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
