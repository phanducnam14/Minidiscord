package com.example.minidiscord.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UnreadSnapshotDTO {
    private long totalUnreadCount;
    private long totalMentionCount;
    private long unreadNotificationCount;
    private List<UnreadChannelSummaryDTO> channels;
    private List<ServerUnreadSummaryDTO> servers;
}
