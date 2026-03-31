package com.example.minidiscord.schema;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServerRole {
    private String id;
    private String name;
    private Set<ServerPermission> permissions = new HashSet<>();
    private boolean systemRole;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ServerRole(String id, String name, Set<ServerPermission> permissions, boolean systemRole) {
        this.id = id;
        this.name = name;
        this.permissions = permissions != null ? new HashSet<>(permissions) : new HashSet<>();
        this.systemRole = systemRole;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
}
