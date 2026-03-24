package com.example.minidiscord.repository;

import com.example.minidiscord.schema.Channel;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChannelRepository extends MongoRepository<Channel, String> {
    List<Channel> findByServerId(String serverId);
    List<Channel> findByServerIdAndType(String serverId, Channel.ChannelType type);
    void deleteByServerId(String serverId);
}
