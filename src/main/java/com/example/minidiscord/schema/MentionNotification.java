package com.example.minidiscord.schema;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Document(collection = "mention_notifications")
public class MentionNotification {
    @Id
    private String id;

    @Indexed
    private String userId;

    @Indexed
    private String serverId;

    @Indexed
    private String channelId;

    private String messageId;
    private String senderId;
    private String preview;
    private boolean read;
    private LocalDateTime createdAt;
    private LocalDateTime readAt;

    public MentionNotification(String userId, String serverId, String channelId,
                               String messageId, String senderId, String preview,
                               LocalDateTime createdAt) {
        this.userId = userId;
        this.serverId = serverId;
        this.channelId = channelId;
        this.messageId = messageId;
        this.senderId = senderId;
        this.preview = preview;
        this.read = false;
        this.createdAt = createdAt;
    }
}
