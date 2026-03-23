package com.example.minidiscord.controller;

import com.example.minidiscord.dto.MessageDTO;
import com.example.minidiscord.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/channels")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    /**
     * Lịch sử tin nhắn với phân trang — mới nhất trước
     */
    @GetMapping("/{channelId}/messages")
    public ResponseEntity<List<MessageDTO>> getMessages(
            @PathVariable("channelId") String channelId,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "50") int size) {
        List<MessageDTO> messages = messageService.getMessages(channelId, page, size);
        return ResponseEntity.ok(messages);
    }

    /**
     * Lấy danh sách user đang trong voice channel
     * (được quản lý in-memory bởi VoiceWebSocketController)
     */
    @GetMapping("/{channelId}/participants")
    public ResponseEntity<List<String>> getVoiceParticipants(@PathVariable("channelId") String channelId) {
        // Delegate sang VoiceWebSocketController thông qua static map
        List<String> participants = com.example.minidiscord.controller.VoiceWebSocketController.getParticipants(channelId);
        return ResponseEntity.ok(participants);
    }
}
