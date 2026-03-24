package com.example.minidiscord.controller;

import com.example.minidiscord.dto.ChatMessage;
import com.example.minidiscord.dto.MessageDTO;
import com.example.minidiscord.schema.User;
import com.example.minidiscord.service.MessageService;
import com.example.minidiscord.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Controller
@RequiredArgsConstructor
public class ChatController {
    private final SimpMessagingTemplate messagingTemplate;
    private final MessageService messageService;
    private final UserService userService;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_DATE_TIME;

    /**
     * Nhận tin nhắn từ client → lưu DB → broadcast tới /topic/channel/{channelId}
     * Client gửi tới: /app/chat/{channelId}
     */
    @MessageMapping("/chat/{channelId}")
    public void handleChatMessage(
            @DestinationVariable("channelId") String channelId,
            ChatMessage chatMessage,
            Principal principal) {
        // Lấy thông tin user từ session
        User user = getUserFromPrincipal(principal);
        if (user == null) return;

        // Chỉ xử lý SEND
        if (chatMessage.getType() != ChatMessage.MessageType.SEND) return;

        // Lưu vào database
        MessageDTO saved = messageService.saveMessage(
            channelId,
            user.getId(),
            chatMessage.getContent(),
            chatMessage.getMessageType(),
            chatMessage.getFileUrl(),
            chatMessage.getFileName()
        );

        // Tạo message broadcast
        ChatMessage broadcast = new ChatMessage();
        broadcast.setType(ChatMessage.MessageType.SEND);
        broadcast.setChannelId(channelId);
        broadcast.setSenderId(user.getId());
        broadcast.setSenderName(user.getDisplayName());
        broadcast.setSenderAvatar(user.getAvatarUrl());
        broadcast.setContent(saved.getContent());
        broadcast.setMessageId(saved.getId());
        broadcast.setFileUrl(saved.getFileUrl());
        broadcast.setFileName(saved.getFileName());
        broadcast.setMessageType(saved.getType());
        broadcast.setTimestamp(saved.getCreatedAt() != null
            ? saved.getCreatedAt().format(FORMATTER) : LocalDateTime.now().format(FORMATTER));

        messagingTemplate.convertAndSend("/topic/channel/" + channelId, broadcast);
    }

    /**
     * Thu hồi tin nhắn — kiểm tra quyền → broadcast REVOKE event
     * Client gửi tới: /app/chat/{channelId}/revoke/{messageId}
     */
    @MessageMapping("/chat/{channelId}/revoke/{messageId}")
    public void revokeMessage(
            @DestinationVariable("channelId") String channelId,
            @DestinationVariable("messageId") String messageId,
            Principal principal) {
        User user = getUserFromPrincipal(principal);
        if (user == null) return;

        messageService.revokeMessage(messageId, user.getId()).ifPresent(revoked -> {
            ChatMessage event = new ChatMessage();
            event.setType(ChatMessage.MessageType.REVOKE);
            event.setChannelId(channelId);
            event.setMessageId(messageId);
            event.setSenderId(user.getId());
            event.setTimestamp(LocalDateTime.now().format(FORMATTER));

            messagingTemplate.convertAndSend("/topic/channel/" + channelId, event);
        });
    }

    /**
     * Typing indicator — KHÔNG lưu DB, chỉ broadcast
     * Client gửi tới: /app/chat/{channelId}/typing
     */
    @MessageMapping("/chat/{channelId}/typing")
    public void handleTyping(
            @DestinationVariable("channelId") String channelId,
            Principal principal) {
        User user = getUserFromPrincipal(principal);
        if (user == null) return;

        ChatMessage typingEvent = new ChatMessage();
        typingEvent.setType(ChatMessage.MessageType.TYPING);
        typingEvent.setChannelId(channelId);
        typingEvent.setSenderId(user.getId());
        typingEvent.setSenderName(user.getDisplayName());
        typingEvent.setTimestamp(LocalDateTime.now().format(FORMATTER));

        messagingTemplate.convertAndSend("/topic/channel/" + channelId + "/typing", typingEvent);
    }

    private User getUserFromPrincipal(Principal principal) {
        if (principal == null) return null;
        if (principal instanceof OAuth2User oauth2User) {
            return userService.findByGoogleId(oauth2User.getName()).orElse(null);
        }
        // Fallback: dùng name như googleId
        return userService.findByGoogleId(principal.getName()).orElse(null);
    }
}
