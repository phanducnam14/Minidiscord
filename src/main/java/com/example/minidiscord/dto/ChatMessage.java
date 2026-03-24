package com.example.minidiscord.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO cho WebSocket chat message (SEND, REVOKE, TYPING)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {
    // Loại tin nhắn
    private MessageType type; // SEND, REVOKE, TYPING

    private String channelId;
    private String senderId;
    private String senderName;
    private String senderAvatar;
    private String content;
    private String messageId;   // dùng cho REVOKE
    private String fileUrl;
    private String fileName;
    private String timestamp;

    // Loại tin nhắn trong channel
    private String messageType; // TEXT, IMAGE, FILE

    public enum MessageType {
        SEND, REVOKE, TYPING
    }
}
