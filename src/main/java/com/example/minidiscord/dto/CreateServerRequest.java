package com.example.minidiscord.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request body tạo server mới
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateServerRequest {
    private String name;
    private String iconUrl;
}
