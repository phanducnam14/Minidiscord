package com.example.minidiscord.repository;

import com.example.minidiscord.schema.ChannelUnreadState;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChannelUnreadStateRepository extends MongoRepository<ChannelUnreadState, String> {
    Optional<ChannelUnreadState> findByUserIdAndChannelId(String userId, String channelId);
    List<ChannelUnreadState> findByUserId(String userId);
    List<ChannelUnreadState> findByUserIdAndServerId(String userId, String serverId);
}
