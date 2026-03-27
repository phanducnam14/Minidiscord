package com.example.minidiscord.schema;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Subdocument nhúng vào Server để lưu thông tin thành viên
 */
@Data
@NoArgsConstructor
public class ServerMember {
    private String userId;
    private Role role;
    private List<String> roleIds = new ArrayList<>();
    private LocalDateTime joinedAt;

    public ServerMember(String userId, Role role, LocalDateTime joinedAt) {
        this.userId = userId;
        this.role = role;
        this.joinedAt = joinedAt;
    }

    public ServerMember(String userId, List<String> roleIds, LocalDateTime joinedAt) {
        this.userId = userId;
        this.roleIds = roleIds != null ? new ArrayList<>(roleIds) : new ArrayList<>();
        this.joinedAt = joinedAt;
    }

    public enum Role {
        OWNER, ADMIN, MEMBER
    }
}
