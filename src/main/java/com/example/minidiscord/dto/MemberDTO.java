package com.example.minidiscord.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MemberDTO {
    private String userId;
    private String displayName;
    private String avatarUrl;
    private String role; // OWNER, ADMIN, MEMBER
    private List<String> roleIds;
    private LocalDateTime joinedAt;
}
