package com.example.minidiscord.repository;

import com.example.minidiscord.schema.MentionNotification;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MentionNotificationRepository extends MongoRepository<MentionNotification, String> {
    List<MentionNotification> findByUserIdOrderByCreatedAtDesc(String userId);
    List<MentionNotification> findByUserIdAndReadOrderByCreatedAtDesc(String userId, boolean read);
    long countByUserIdAndRead(String userId, boolean read);
    Optional<MentionNotification> findByIdAndUserId(String id, String userId);
}
