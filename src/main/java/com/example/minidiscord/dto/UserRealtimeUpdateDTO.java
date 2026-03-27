package com.example.minidiscord.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserRealtimeUpdateDTO {
    private String recipientGoogleId;
    private UnreadSnapshotDTO unreadSnapshot;
    private MentionNotificationDTO mentionNotification;
}
