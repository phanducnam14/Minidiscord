package com.example.minidiscord.schema;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Subdocument nhúng vào Server để lưu thông tin thành viên
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServerMember {
    private String userId;
    private Role role;
    private LocalDateTime joinedAt;

    public enum Role {
        OWNER, ADMIN, MEMBER
    }
}
