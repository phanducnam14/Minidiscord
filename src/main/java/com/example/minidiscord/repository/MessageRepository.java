package com.example.minidiscord.repository;

import com.example.minidiscord.schema.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MessageRepository extends MongoRepository<Message, String> {
    // Lấy tin nhắn theo channel với phân trang
    Page<Message> findByChannelIdOrderByCreatedAtDesc(String channelId, Pageable pageable);
}
