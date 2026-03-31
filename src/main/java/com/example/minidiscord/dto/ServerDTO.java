package com.example.minidiscord.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServerDTO {
    private String id;
    private String name;
    private String iconUrl;
    private String ownerId;
    private List<MemberDTO> members;
    private List<RoleDTO> roles;
    private Set<String> currentUserPermissions;
    private LocalDateTime createdAt;
}
