package com.example.minidiscord.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WebRTCSignalDTO {
    private String type;     // OFFER, ANSWER, CANDIDATE
    private String from;     // sender userId
    private String to;       // receiver userId
    private Object data;     // SDP or ICE candidate data
}
