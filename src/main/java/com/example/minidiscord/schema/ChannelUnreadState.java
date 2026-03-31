package com.example.minidiscord.schema;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Document(collection = "channel_unread_states")
@CompoundIndexes({
    @CompoundIndex(name = "user_channel_unique", def = "{'userId': 1, 'channelId': 1}", unique = true)
})
public class ChannelUnreadState {
    @Id
    private String id;

    @Indexed
    private String userId;

    @Indexed
    private String serverId;

    @Indexed
    private String channelId;

    private long unreadCount;
    private long mentionCount;
    private String lastMessageId;
    private LocalDateTime lastMessageAt;
    private LocalDateTime lastReadAt;
    private LocalDateTime updatedAt;

    public ChannelUnreadState(String userId, String serverId, String channelId) {
        this.userId = userId;
        this.serverId = serverId;
        this.channelId = channelId;
        this.unreadCount = 0;
        this.mentionCount = 0;
        this.lastReadAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
}
