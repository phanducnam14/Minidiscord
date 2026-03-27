package com.example.minidiscord.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServerUnreadSummaryDTO {
    private String serverId;
    private long unreadCount;
    private long mentionCount;
    private List<UnreadChannelSummaryDTO> channels;
}
