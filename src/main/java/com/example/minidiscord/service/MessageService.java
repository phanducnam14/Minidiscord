package com.example.minidiscord.service;

import com.example.minidiscord.dto.MessageDTO;
import com.example.minidiscord.exception.ForbiddenException;
import com.example.minidiscord.exception.NotFoundException;
import com.example.minidiscord.schema.Message;
import com.example.minidiscord.schema.User;
import com.example.minidiscord.repository.MessageRepository;
import com.example.minidiscord.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageService {
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    private static final Pattern MENTION_PATTERN = Pattern.compile("<@([^>\\s]+)>");

    /**
     * Lưu tin nhắn mới vào database
     */
    public MessageDTO saveMessage(String channelId, String senderId,
                                  String content, String messageType,
                                  String fileUrl, String fileName) {
        Message.MessageType type = Message.MessageType.TEXT;
        if (messageType != null) {
            try {
                type = Message.MessageType.valueOf(messageType.toUpperCase());
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Loại tin nhắn không hợp lệ: " + messageType);
            }
        }

        Message message = new Message(channelId, senderId, content, type, fileUrl, fileName);
        if (type == Message.MessageType.TEXT) {
            message.setMentionedUserIds(extractMentionUserIds(content));
        }
        message = messageRepository.save(message);
        return toDTO(message);
    }

    /**
     * Lấy lịch sử tin nhắn theo channel với phân trang
     */
    public List<MessageDTO> getMessages(String channelId, int page, int size) {
        Page<Message> messagePage = messageRepository.findByChannelIdOrderByCreatedAtDesc(
            channelId, PageRequest.of(page, size)
        );
        // Đảo ngược để tin nhắn cũ hiện trước
        List<Message> messages = messagePage.getContent();
        return messages.stream().map(this::toDTO).collect(Collectors.toList());
    }

    /**
     * Thu hồi tin nhắn — chỉ người gửi mới được phép
     */
    public Optional<MessageDTO> revokeMessage(String channelId, String messageId, String requesterId, boolean canManageMessages) {
        return messageRepository.findById(messageId).map(message -> {
            if (!message.getChannelId().equals(channelId)) {
                throw new NotFoundException("Tin nhắn không thuộc channel này");
            }
            if (!message.getSenderId().equals(requesterId) && !canManageMessages) {
                throw new ForbiddenException("Không có quyền thu hồi tin nhắn này");
            }
            message.setRevoked(true);
            message.setUpdatedAt(LocalDateTime.now());
            return toDTO(messageRepository.save(message));
        });
    }

    public Optional<Message> findById(String messageId) {
        return messageRepository.findById(messageId);
    }

    /**
     * Thêm/Gỡ reaction khỏi tin nhắn
     */
    public MessageDTO toggleReaction(String messageId, String userId, String emoji) {
        Message message = messageRepository.findById(messageId)
            .orElseThrow(() -> new NotFoundException("Không tìm thấy tin nhắn"));
        
        java.util.Map<String, java.util.List<String>> reactions = message.getReactions();
        java.util.List<String> userIds = reactions.get(emoji);
        if (userIds == null) {
            userIds = new java.util.ArrayList<>();
            reactions.put(emoji, userIds);
        }
        
        if (userIds.contains(userId)) {
            userIds.remove(userId);
            if (userIds.isEmpty()) {
                reactions.remove(emoji);
            }
        } else {
            userIds.add(userId);
        }
        
        message.setUpdatedAt(LocalDateTime.now());
        return toDTO(messageRepository.save(message));
    }

    private MessageDTO toDTO(Message message) {
        User sender = userRepository.findById(message.getSenderId()).orElse(null);
        return new MessageDTO(
            message.getId(),
            message.getChannelId(),
            message.getSenderId(),
            sender != null ? sender.getDisplayName() : "Unknown",
            sender != null ? sender.getAvatarUrl() : null,
            message.getContent(),
            message.getType().name(),
            message.getFileUrl(),
            message.getFileName(),
            message.isRevoked(),
            message.getCreatedAt(),
            message.getUpdatedAt(),
            message.getMentionedUserIds(),
            message.getReactions()
        );
    }

    private List<String> extractMentionUserIds(String content) {
        if (content == null || content.isBlank()) {
            return new ArrayList<>();
        }

        LinkedHashSet<String> mentionIds = new LinkedHashSet<>();
        Matcher matcher = MENTION_PATTERN.matcher(content);
        while (matcher.find()) {
            String userId = matcher.group(1).trim();
            if (!userId.isEmpty()) {
                mentionIds.add(userId);
            }
        }

        return new ArrayList<>(mentionIds);
    }
}
