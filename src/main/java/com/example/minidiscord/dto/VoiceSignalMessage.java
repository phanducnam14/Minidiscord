package com.example.minidiscord.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO cho WebRTC voice signaling (JOINED, LEFT, OFFER, ANSWER, ICE_CANDIDATE)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VoiceSignalMessage {
    private SignalType type; // JOINED, LEFT, OFFER, ANSWER, ICE_CANDIDATE

    private String fromUserId;
    private String fromUserName;
    private String fromUserAvatar;

    private String toUserId;
    private String channelId;

    private String sdp;       // cho OFFER/ANSWER
    private String candidate; // cho ICE_CANDIDATE

    public enum SignalType {
        JOINED, LEFT, OFFER, ANSWER, ICE_CANDIDATE
    }
}
