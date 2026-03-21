package com.example.minidiscord.controller;

import com.example.minidiscord.dto.ChannelDTO;
import com.example.minidiscord.dto.CreateChannelRequest;
import com.example.minidiscord.service.ChannelService;
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
@RequestMapping("/api/servers/{serverId}/channels")
@RequiredArgsConstructor
public class ChannelController {
    private final ChannelService channelService;
    private final ServerService serverService;
    private final UserService userService;

    /**
     * Tạo channel mới — chỉ OWNER hoặc ADMIN được phép
     */
    @PostMapping
    public ResponseEntity<ChannelDTO> createChannel(
            @PathVariable String serverId,
            @RequestBody CreateChannelRequest request,
            @AuthenticationPrincipal OAuth2User principal) {
        User user = getCurrentUser(principal);
        // Kiểm tra quyền
        if (!serverService.isOwnerOrAdmin(serverId, user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        ChannelDTO channel = channelService.createChannel(serverId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(channel);
    }

    /**
     * Danh sách channel của server
     */
    @GetMapping
    public ResponseEntity<List<ChannelDTO>> getChannels(@PathVariable String serverId) {
        return ResponseEntity.ok(channelService.getChannelsByServer(serverId));
    }

    /**
     * Xoá channel — chỉ OWNER hoặc ADMIN được phép
     */
    @DeleteMapping("/{channelId}")
    public ResponseEntity<Void> deleteChannel(
            @PathVariable String serverId,
            @PathVariable String channelId,
            @AuthenticationPrincipal OAuth2User principal) {
        User user = getCurrentUser(principal);
        if (!serverService.isOwnerOrAdmin(serverId, user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        if (channelService.deleteChannel(channelId)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * Sửa channel — chỉ OWNER hoặc ADMIN được phép
     */
    @PutMapping("/{channelId}")
    public ResponseEntity<ChannelDTO> updateChannel(
            @PathVariable String serverId,
            @PathVariable String channelId,
            @RequestBody CreateChannelRequest request,
            @AuthenticationPrincipal OAuth2User principal) {
        User user = getCurrentUser(principal);
        if (!serverService.isOwnerOrAdmin(serverId, user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(channelService.updateChannel(channelId, request));
    }

    private User getCurrentUser(OAuth2User principal) {
        return userService.findByGoogleId(principal.getName())
            .orElseThrow(() -> new RuntimeException("User không tồn tại"));
    }
}
