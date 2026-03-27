package com.example.minidiscord.schema;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@Document(collection = "messages")
public class Message {
    @Id
    private String id;

    @Indexed
    private String channelId;

    private String senderId;
    private String content;

    private MessageType type = MessageType.TEXT; // TEXT, IMAGE, FILE

    private String fileUrl;
    private String fileName;

    private boolean revoked = false; // Tin nhắn đã bị thu hồi

    // Mention metadata chuẩn hóa từ content: <@userId>
    private List<String> mentionedUserIds = new ArrayList<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Reactions: emoji -> list of userIds
    private Map<String, List<String>> reactions = new HashMap<>();

    public Message(String channelId, String senderId, String content, MessageType type,
                   String fileUrl, String fileName) {
        this.channelId = channelId;
        this.senderId = senderId;
        this.content = content;
        this.type = type != null ? type : MessageType.TEXT;
        this.fileUrl = fileUrl;
        this.fileName = fileName;
        this.revoked = false;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public enum MessageType {
        TEXT, IMAGE, FILE
    }
}
