package com.example.minidiscord.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UnreadChannelSummaryDTO {
    private String serverId;
    private String channelId;
    private String channelName;
    private long unreadCount;
    private long mentionCount;
    private String lastMessageId;
    private LocalDateTime lastMessageAt;
}
