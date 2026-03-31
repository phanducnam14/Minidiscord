package com.example.minidiscord.controller;

import com.example.minidiscord.dto.MentionNotificationDTO;
import com.example.minidiscord.service.UnreadNotificationService;
import com.example.minidiscord.service.UserService;
import com.example.minidiscord.schema.User;
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
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final UnreadNotificationService unreadNotificationService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<MentionNotificationDTO>> getNotifications(
            @RequestParam(name = "unreadOnly", defaultValue = "false") boolean unreadOnly,
            @AuthenticationPrincipal OAuth2User principal) {
        User user = getCurrentUser(principal);
        return ResponseEntity.ok(unreadNotificationService.getNotifications(user.getId(), unreadOnly));
    }

    @PostMapping("/{notificationId}/read")
    public ResponseEntity<MentionNotificationDTO> markNotificationRead(
            @PathVariable("notificationId") String notificationId,
            @AuthenticationPrincipal OAuth2User principal) {
        User user = getCurrentUser(principal);
        return ResponseEntity.ok(unreadNotificationService.markNotificationRead(user.getId(), notificationId));
    }

    private User getCurrentUser(OAuth2User principal) {
        return userService.findByGoogleId(principal.getName())
            .orElseThrow(() -> new RuntimeException("User không tồn tại"));
    }
}
