package com.example.minidiscord.service;

import com.example.minidiscord.dto.ChannelDTO;
import com.example.minidiscord.dto.CreateChannelRequest;
import com.example.minidiscord.schema.Channel;
import com.example.minidiscord.repository.ChannelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChannelService {
    private final ChannelRepository channelRepository;

    public ChannelDTO createChannel(String serverId, CreateChannelRequest request) {
        Channel.ChannelType type = Channel.ChannelType.valueOf(
            request.getType() != null ? request.getType().toUpperCase() : "TEXT"
        );
        Channel channel = new Channel(serverId, request.getName(), type);
        channel = channelRepository.save(channel);
        return toDTO(channel);
    }

    public List<ChannelDTO> getChannelsByServer(String serverId) {
        return channelRepository.findByServerId(serverId)
            .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public boolean deleteChannel(String channelId) {
        if (channelRepository.existsById(channelId)) {
            channelRepository.deleteById(channelId);
            return true;
        }
        return false;
    }

    public Optional<Channel> findById(String channelId) {
        return channelRepository.findById(channelId);
    }

    public ChannelDTO updateChannel(String channelId, CreateChannelRequest request) {
        Channel channel = channelRepository.findById(channelId)
            .orElseThrow(() -> new RuntimeException("Channel không tồn tại"));
        if (request.getName() != null && !request.getName().isBlank()) {
            channel.setName(request.getName().trim().toLowerCase().replace(" ", "-"));
        }
        return toDTO(channelRepository.save(channel));
    }

    private ChannelDTO toDTO(Channel channel) {
        return new ChannelDTO(
            channel.getId(),
            channel.getServerId(),
            channel.getName(),
            channel.getType().name(),
            channel.getCreatedAt()
        );
    }
}
