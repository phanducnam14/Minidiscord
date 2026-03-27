package com.example.minidiscord.controller;

import com.example.minidiscord.dto.MessageDTO;
import com.example.minidiscord.dto.UnreadSnapshotDTO;
import com.example.minidiscord.exception.NotFoundException;
import com.example.minidiscord.schema.ServerPermission;
import com.example.minidiscord.schema.User;
import com.example.minidiscord.service.MessageService;
import com.example.minidiscord.service.ServerService;
import com.example.minidiscord.service.UnreadNotificationService;
import com.example.minidiscord.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/channels")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;
    private final UnreadNotificationService unreadNotificationService;
    private final UserService userService;
    private final ServerService serverService;

    @GetMapping("/{channelId}/messages")
    public ResponseEntity<List<MessageDTO>> getMessages(
            @PathVariable("channelId") String channelId,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "50") int size,
            @AuthenticationPrincipal OAuth2User principal) {
        User user = getCurrentUser(principal);
        serverService.requireChannelPermission(channelId, user.getId(), ServerPermission.MESSAGE_VIEW);
        List<MessageDTO> messages = messageService.getMessages(channelId, page, size);
        return ResponseEntity.ok(messages);
    }

    @GetMapping("/unread")
    public ResponseEntity<UnreadSnapshotDTO> getUnreadSnapshot(
            @AuthenticationPrincipal OAuth2User principal) {
        User user = getCurrentUser(principal);
        return ResponseEntity.ok(unreadNotificationService.getUnreadSnapshot(user.getId()));
    }

    @PostMapping("/{channelId}/read")
    public ResponseEntity<UnreadSnapshotDTO> markChannelRead(
            @PathVariable("channelId") String channelId,
            @AuthenticationPrincipal OAuth2User principal) {
        User user = getCurrentUser(principal);
        serverService.requireChannelPermission(channelId, user.getId(), ServerPermission.MESSAGE_VIEW);
        return ResponseEntity.ok(unreadNotificationService.markChannelRead(user.getId(), channelId));
    }

    @GetMapping("/{channelId}/participants")
    public ResponseEntity<List<String>> getVoiceParticipants(
            @PathVariable("channelId") String channelId,
            @AuthenticationPrincipal OAuth2User principal) {
        User user = getCurrentUser(principal);
        serverService.requireChannelPermission(channelId, user.getId(), ServerPermission.VOICE_CONNECT);
        List<String> participants = VoiceWebSocketController.getParticipants(channelId);
        return ResponseEntity.ok(participants);
    }

    private User getCurrentUser(OAuth2User principal) {
        if (principal == null) {
            throw new NotFoundException("User không tồn tại");
        }
        return userService.findByGoogleId(principal.getName())
            .orElseThrow(() -> new NotFoundException("User không tồn tại"));
    }
}
