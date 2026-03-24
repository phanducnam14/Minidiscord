package com.example.minidiscord.controller;

import com.example.minidiscord.dto.CreateServerRequest;
import com.example.minidiscord.dto.MemberDTO;
import com.example.minidiscord.dto.ServerDTO;
import com.example.minidiscord.service.ServerService;
import com.example.minidiscord.service.UserService;
import com.example.minidiscord.schema.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/servers")
@RequiredArgsConstructor
public class ServerController {
    private final ServerService serverService;
    private final UserService userService;

    /**
     * Tạo server mới — người tạo tự động là OWNER
     */
    @PostMapping
    public ResponseEntity<ServerDTO> createServer(
            @RequestBody CreateServerRequest request,
            @AuthenticationPrincipal OAuth2User principal) {
        User user = getCurrentUser(principal);
        ServerDTO server = serverService.createServer(request, user.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(server);
    }

    /**
     * Danh sách server của user đang đăng nhập
     */
    @GetMapping("/my")
    public ResponseEntity<List<ServerDTO>> getMyServers(
            @AuthenticationPrincipal OAuth2User principal) {
        User user = getCurrentUser(principal);
        return ResponseEntity.ok(serverService.getMyServers(user.getId()));
    }

    /**
     * Tham gia server
     */
    @PostMapping("/{serverId}/join")
    public ResponseEntity<ServerDTO> joinServer(
            @PathVariable("serverId") String serverId,
            @AuthenticationPrincipal OAuth2User principal) {
        User user = getCurrentUser(principal);
        ServerDTO server = serverService.joinServer(serverId, user.getId());
        return ResponseEntity.ok(server);
    }

    /**
     * Danh sách thành viên của server
     */
    @GetMapping("/{serverId}/members")
    public ResponseEntity<List<MemberDTO>> getMembers(@PathVariable("serverId") String serverId) {
        return ResponseEntity.ok(serverService.getMembers(serverId));
    }

    /**
     * Thông tin cơ bản server
     */
    @GetMapping("/{serverId}")
    public ResponseEntity<ServerDTO> getServer(@PathVariable("serverId") String serverId) {
        return ResponseEntity.ok(serverService.getServer(serverId));
    }

    /**
     * Cập nhật thông tin server — chỉ OWNER hoặc ADMIN
     */
    @PutMapping("/{serverId}")
    public ResponseEntity<ServerDTO> updateServer(
            @PathVariable("serverId") String serverId,
            @RequestBody CreateServerRequest request,
            @AuthenticationPrincipal OAuth2User principal) {
        User user = getCurrentUser(principal);
        if (!serverService.isOwnerOrAdmin(serverId, user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(serverService.updateServer(serverId, request));
    }

    /**
     * Xoá server — chỉ OWNER
     */
    @DeleteMapping("/{serverId}")
    public ResponseEntity<Void> deleteServer(
            @PathVariable("serverId") String serverId,
            @AuthenticationPrincipal OAuth2User principal) {
        User user = getCurrentUser(principal);
        boolean isOwner = serverService.findById(serverId)
            .map(s -> s.getOwnerId().equals(user.getId())).orElse(false);
        if (!isOwner) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        if (serverService.deleteServer(serverId)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    // Helper lấy User từ OAuth2 principal
    private User getCurrentUser(OAuth2User principal) {
        String googleId = principal.getName();
        return userService.findByGoogleId(googleId)
            .orElseThrow(() -> new RuntimeException("User không tồn tại"));
    }
}
