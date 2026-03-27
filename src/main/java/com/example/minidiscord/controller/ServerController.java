package com.example.minidiscord.controller;

import com.example.minidiscord.dto.CreateServerRequest;
import com.example.minidiscord.dto.MemberDTO;
import com.example.minidiscord.dto.RoleDTO;
import com.example.minidiscord.dto.ServerDTO;
import com.example.minidiscord.dto.ServerUnreadSummaryDTO;
import com.example.minidiscord.dto.UpdateMemberRolesRequest;
import com.example.minidiscord.dto.UpsertRoleRequest;
import com.example.minidiscord.exception.NotFoundException;
import com.example.minidiscord.schema.User;
import com.example.minidiscord.service.ServerService;
import com.example.minidiscord.service.UnreadNotificationService;
import com.example.minidiscord.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/servers")
@RequiredArgsConstructor
public class ServerController {
    private final ServerService serverService;
    private final UnreadNotificationService unreadNotificationService;
    private final UserService userService;

    @PostMapping
    public ResponseEntity<ServerDTO> createServer(
            @RequestBody CreateServerRequest request,
            @AuthenticationPrincipal OAuth2User principal) {
        User user = getCurrentUser(principal);
        ServerDTO server = serverService.createServer(request, user.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(server);
    }

    @GetMapping("/my")
    public ResponseEntity<List<ServerDTO>> getMyServers(
            @AuthenticationPrincipal OAuth2User principal) {
        User user = getCurrentUser(principal);
        return ResponseEntity.ok(serverService.getMyServers(user.getId()));
    }

    @PostMapping("/{serverId}/join")
    public ResponseEntity<ServerDTO> joinServer(
            @PathVariable("serverId") String serverId,
            @AuthenticationPrincipal OAuth2User principal) {
        User user = getCurrentUser(principal);
        ServerDTO server = serverService.joinServer(serverId, user.getId());
        return ResponseEntity.ok(server);
    }

    @PostMapping("/{serverId}/leave")
    public ResponseEntity<ServerDTO> leaveServer(
            @PathVariable("serverId") String serverId,
            @AuthenticationPrincipal OAuth2User principal) {
        User user = getCurrentUser(principal);
        return ResponseEntity.ok(serverService.leaveServer(serverId, user.getId()));
    }

    @GetMapping("/{serverId}/members")
    public ResponseEntity<List<MemberDTO>> getMembers(
            @PathVariable("serverId") String serverId,
            @AuthenticationPrincipal OAuth2User principal) {
        User user = getCurrentUser(principal);
        return ResponseEntity.ok(serverService.getMembers(serverId, user.getId()));
    }

    @PutMapping("/{serverId}/members/{memberUserId}/roles")
    public ResponseEntity<MemberDTO> updateMemberRoles(
            @PathVariable("serverId") String serverId,
            @PathVariable("memberUserId") String memberUserId,
            @RequestBody UpdateMemberRolesRequest request,
            @AuthenticationPrincipal OAuth2User principal) {
        User user = getCurrentUser(principal);
        MemberDTO member = serverService.updateMemberRoles(serverId, memberUserId, request, user.getId());
        return ResponseEntity.ok(member);
    }

    @DeleteMapping("/{serverId}/members/{memberUserId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable("serverId") String serverId,
            @PathVariable("memberUserId") String memberUserId,
            @AuthenticationPrincipal OAuth2User principal) {
        User user = getCurrentUser(principal);
        serverService.removeMember(serverId, memberUserId, user.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{serverId}/roles")
    public ResponseEntity<List<RoleDTO>> getRoles(
            @PathVariable("serverId") String serverId,
            @AuthenticationPrincipal OAuth2User principal) {
        User user = getCurrentUser(principal);
        return ResponseEntity.ok(serverService.getRoles(serverId, user.getId()));
    }

    @PostMapping("/{serverId}/roles")
    public ResponseEntity<RoleDTO> createRole(
            @PathVariable("serverId") String serverId,
            @RequestBody UpsertRoleRequest request,
            @AuthenticationPrincipal OAuth2User principal) {
        User user = getCurrentUser(principal);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(serverService.createRole(serverId, request, user.getId()));
    }

    @PutMapping("/{serverId}/roles/{roleId}")
    public ResponseEntity<RoleDTO> updateRole(
            @PathVariable("serverId") String serverId,
            @PathVariable("roleId") String roleId,
            @RequestBody UpsertRoleRequest request,
            @AuthenticationPrincipal OAuth2User principal) {
        User user = getCurrentUser(principal);
        return ResponseEntity.ok(serverService.updateRole(serverId, roleId, request, user.getId()));
    }

    @DeleteMapping("/{serverId}/roles/{roleId}")
    public ResponseEntity<Void> deleteRole(
            @PathVariable("serverId") String serverId,
            @PathVariable("roleId") String roleId,
            @AuthenticationPrincipal OAuth2User principal) {
        User user = getCurrentUser(principal);
        serverService.deleteRole(serverId, roleId, user.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{serverId}")
    public ResponseEntity<ServerDTO> getServer(
            @PathVariable("serverId") String serverId,
            @AuthenticationPrincipal OAuth2User principal) {
        User user = getCurrentUser(principal);
        return ResponseEntity.ok(serverService.getServer(serverId, user.getId()));
    }

    @GetMapping("/{serverId}/unread")
    public ResponseEntity<ServerUnreadSummaryDTO> getServerUnread(
            @PathVariable("serverId") String serverId,
            @AuthenticationPrincipal OAuth2User principal) {
        User user = getCurrentUser(principal);
        return ResponseEntity.ok(unreadNotificationService.getServerUnreadSummary(user.getId(), serverId));
    }

    @PutMapping("/{serverId}")
    public ResponseEntity<ServerDTO> updateServer(
            @PathVariable("serverId") String serverId,
            @RequestBody CreateServerRequest request,
            @AuthenticationPrincipal OAuth2User principal) {
        User user = getCurrentUser(principal);
        return ResponseEntity.ok(serverService.updateServer(serverId, request, user.getId()));
    }

    @DeleteMapping("/{serverId}")
    public ResponseEntity<Void> deleteServer(
            @PathVariable("serverId") String serverId,
            @AuthenticationPrincipal OAuth2User principal) {
        User user = getCurrentUser(principal);
        serverService.deleteServer(serverId, user.getId());
        return ResponseEntity.noContent().build();
    }

    private User getCurrentUser(OAuth2User principal) {
        if (principal == null) {
            throw new NotFoundException("User không tồn tại");
        }
        return userService.findByGoogleId(principal.getName())
            .orElseThrow(() -> new NotFoundException("User không tồn tại"));
    }
}
