package com.example.minidiscord.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpsertRoleRequest {
    private String name;
    private Set<String> permissions;
}
