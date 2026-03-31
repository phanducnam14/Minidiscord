package com.example.minidiscord.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChannelDTO {
    private String id;
    private String serverId;
    private String name;
    private String type; // TEXT hoặc VOICE
    private LocalDateTime createdAt;
}
