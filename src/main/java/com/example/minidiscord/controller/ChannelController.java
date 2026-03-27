package com.example.minidiscord.controller;

import com.example.minidiscord.dto.ChannelDTO;
import com.example.minidiscord.dto.CreateChannelRequest;
import com.example.minidiscord.exception.NotFoundException;
import com.example.minidiscord.schema.ServerPermission;
import com.example.minidiscord.schema.User;
import com.example.minidiscord.service.ChannelService;
import com.example.minidiscord.service.ServerService;
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
@RequestMapping("/api/servers/{serverId}/channels")
@RequiredArgsConstructor
public class ChannelController {
    private final ChannelService channelService;
    private final ServerService serverService;
    private final UserService userService;

    @PostMapping
    public ResponseEntity<ChannelDTO> createChannel(
            @PathVariable("serverId") String serverId,
            @RequestBody CreateChannelRequest request,
            @AuthenticationPrincipal OAuth2User principal) {
        User user = getCurrentUser(principal);
        serverService.requirePermission(serverId, user.getId(), ServerPermission.CHANNEL_CREATE);
        ChannelDTO channel = channelService.createChannel(serverId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(channel);
    }

    @GetMapping
    public ResponseEntity<List<ChannelDTO>> getChannels(
            @PathVariable("serverId") String serverId,
            @AuthenticationPrincipal OAuth2User principal) {
        User user = getCurrentUser(principal);
        serverService.requirePermission(serverId, user.getId(), ServerPermission.CHANNEL_VIEW);
        return ResponseEntity.ok(channelService.getChannelsByServer(serverId));
    }

    @DeleteMapping("/{channelId}")
    public ResponseEntity<Void> deleteChannel(
            @PathVariable("serverId") String serverId,
            @PathVariable("channelId") String channelId,
            @AuthenticationPrincipal OAuth2User principal) {
        User user = getCurrentUser(principal);
        serverService.requirePermission(serverId, user.getId(), ServerPermission.CHANNEL_DELETE);
        channelService.deleteChannel(channelId, serverId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{channelId}")
    public ResponseEntity<ChannelDTO> updateChannel(
            @PathVariable("serverId") String serverId,
            @PathVariable("channelId") String channelId,
            @RequestBody CreateChannelRequest request,
            @AuthenticationPrincipal OAuth2User principal) {
        User user = getCurrentUser(principal);
        serverService.requirePermission(serverId, user.getId(), ServerPermission.CHANNEL_UPDATE);
        return ResponseEntity.ok(channelService.updateChannel(channelId, serverId, request));
    }

    private User getCurrentUser(OAuth2User principal) {
        if (principal == null) {
            throw new NotFoundException("User không tồn tại");
        }
        return userService.findByGoogleId(principal.getName())
            .orElseThrow(() -> new NotFoundException("User không tồn tại"));
    }
}
