package com.example.minidiscord.controller;

import com.example.minidiscord.dto.VoiceSignalMessage;
import com.example.minidiscord.schema.User;
import com.example.minidiscord.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

@Controller
@RequiredArgsConstructor
public class VoiceWebSocketController {
    private final SimpMessagingTemplate messagingTemplate;
    private final UserService userService;

    /**
     * Map lưu danh sách user đang trong voice channel
     * Key: channelId, Value: list of userId
     */
    private static final ConcurrentHashMap<String, List<String>> voiceParticipants
        = new ConcurrentHashMap<>();

    /**
     * User tham gia voice channel
     * Client gửi tới: /app/voice/{channelId}/join
     */
    @MessageMapping("/voice/{channelId}/join")
    public void joinVoiceChannel(
            @DestinationVariable String channelId,
            Principal principal) {
        User user = getUserFromPrincipal(principal);
        if (user == null) return;

        // Thêm user vào danh sách participants
        voiceParticipants.computeIfAbsent(channelId, k -> new ArrayList<>());
        List<String> participants = voiceParticipants.get(channelId);
        if (!participants.contains(user.getId())) {
            participants.add(user.getId());
        }

        // Broadcast JOINED tới tất cả người trong channel
        VoiceSignalMessage joined = new VoiceSignalMessage();
        joined.setType(VoiceSignalMessage.SignalType.JOINED);
        joined.setFromUserId(user.getId());
        joined.setFromUserName(user.getDisplayName());
        joined.setFromUserAvatar(user.getAvatarUrl());
        joined.setChannelId(channelId);

        messagingTemplate.convertAndSend("/topic/voice/" + channelId, joined);
    }

    /**
     * User rời voice channel
     * Client gửi tới: /app/voice/{channelId}/leave
     */
    @MessageMapping("/voice/{channelId}/leave")
    public void leaveVoiceChannel(
            @DestinationVariable String channelId,
            Principal principal) {
        User user = getUserFromPrincipal(principal);
        if (user == null) return;

        // Xoá user khỏi danh sách
        List<String> participants = voiceParticipants.getOrDefault(channelId, new ArrayList<>());
        participants.remove(user.getId());

        // Broadcast LEFT
        VoiceSignalMessage left = new VoiceSignalMessage();
        left.setType(VoiceSignalMessage.SignalType.LEFT);
        left.setFromUserId(user.getId());
        left.setChannelId(channelId);

        messagingTemplate.convertAndSend("/topic/voice/" + channelId, left);
    }

    /**
     * Forward WebRTC signal (OFFER/ANSWER/ICE_CANDIDATE) tới user đích
     * Client gửi tới: /app/voice/signal
     */
    @MessageMapping("/voice/signal")
    public void forwardSignal(@Payload VoiceSignalMessage signal) {
        if (signal.getToUserId() == null) return;

        // Gửi tới user đích qua private queue
        messagingTemplate.convertAndSendToUser(
            signal.getToUserId(),
            "/queue/voice/" + signal.getToUserId(),
            signal
        );
    }

    /**
     * Static method để MessageController lấy danh sách participants
     */
    public static List<String> getParticipants(String channelId) {
        return voiceParticipants.getOrDefault(channelId, new ArrayList<>());
    }

    private User getUserFromPrincipal(Principal principal) {
        if (principal == null) return null;
        if (principal instanceof OAuth2User oauth2User) {
            return userService.findByGoogleId(oauth2User.getName()).orElse(null);
        }
        return userService.findByGoogleId(principal.getName()).orElse(null);
    }
}
