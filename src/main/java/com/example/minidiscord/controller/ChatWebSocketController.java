package com.example.minidiscord.controller;

import com.example.minidiscord.dto.ChatMessageDTO;
import com.example.minidiscord.dto.MessageDTO;
import com.example.minidiscord.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class ChatWebSocketController {
    
    @Autowired
    private MessageService messageService;
    
    /**
     * Handle incoming chat messages
     * Client sends to: /app/chat/{serverId}/{channelId}
     * Broadcast to: /topic/channel/{serverId}/{channelId}
     */
    @MessageMapping("/chat/{serverId}/{channelId}")
    @SendTo("/topic/channel/{serverId}/{channelId}")
    public ChatMessageDTO handleChatMessage(
            @DestinationVariable String serverId,
            @DestinationVariable String channelId,
            ChatMessageDTO message) {
        
        // Save message to database
        MessageDTO savedMessage = messageService.saveMessage(
            channelId,
            serverId,
            message.getUserId(),
            message.getUserName(),
            message.getUserAvatar(),
            message.getContent()
        );
        
        // Prepare response
        ChatMessageDTO response = new ChatMessageDTO();
        response.setChannelId(channelId);
        response.setServerId(serverId);
        response.setUserId(message.getUserId());
        response.setUserName(message.getUserName());
        response.setUserAvatar(message.getUserAvatar());
        response.setContent(message.getContent());
        response.setAction("send");
        
        return response;
    }
    
    /**
     * Handle typing indicators
     * Client sends to: /app/typing/{serverId}/{channelId}
     * Broadcast to: /topic/typing/{serverId}/{channelId}
     */
    @MessageMapping("/typing/{serverId}/{channelId}")
    @SendTo("/topic/typing/{serverId}/{channelId}")
    public ChatMessageDTO handleTypingIndicator(
            @DestinationVariable String serverId,
            @DestinationVariable String channelId,
            ChatMessageDTO message) {
        
        message.setAction("typing");
        return message;
    }
}
