package com.example.minidiscord.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageDTO {
    private String channelId;
    private String serverId;
    private String userId;
    private String userName;
    private String userAvatar;
    private String content;
    private String action; // "send" for new message
}
