package com.example.minidiscord.schema;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Document(collection = "channels")
public class Channel {
    @Id
    private String id;

    @Indexed
    private String serverId;

    private String name;
    private ChannelType type; // TEXT hoặc VOICE

    private LocalDateTime createdAt;

    public Channel(String serverId, String name, ChannelType type) {
        this.serverId = serverId;
        this.name = name;
        this.type = type;
        this.createdAt = LocalDateTime.now();
    }

    public enum ChannelType {
        TEXT, VOICE
    }
}
