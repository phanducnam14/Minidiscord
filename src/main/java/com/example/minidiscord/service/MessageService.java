package com.example.minidiscord.service;

import com.example.minidiscord.dto.MessageDTO;
import com.example.minidiscord.schema.Message;
import com.example.minidiscord.schema.User;
import com.example.minidiscord.repository.MessageRepository;
import com.example.minidiscord.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageService {
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    /**
     * Lưu tin nhắn mới vào database
     */
    public MessageDTO saveMessage(String channelId, String senderId,
                                  String content, String messageType,
                                  String fileUrl, String fileName) {
        Message.MessageType type = Message.MessageType.TEXT;
        try {
            if (messageType != null) type = Message.MessageType.valueOf(messageType.toUpperCase());
        } catch (Exception ignored) {}

        Message message = new Message(channelId, senderId, content, type, fileUrl, fileName);
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
    public Optional<MessageDTO> revokeMessage(String messageId, String requesterId) {
        return messageRepository.findById(messageId).map(message -> {
            if (!message.getSenderId().equals(requesterId)) {
                throw new RuntimeException("Không có quyền thu hồi tin nhắn này");
            }
            message.setRevoked(true);
            message.setUpdatedAt(LocalDateTime.now());
            return toDTO(messageRepository.save(message));
        });
    }

    public Optional<Message> findById(String messageId) {
        return messageRepository.findById(messageId);
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
            message.getUpdatedAt()
        );
    }
}
