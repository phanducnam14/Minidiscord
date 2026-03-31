package com.example.minidiscord.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request body tạo channel mới
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateChannelRequest {
    private String name;
    private String type; // TEXT hoặc VOICE
}
