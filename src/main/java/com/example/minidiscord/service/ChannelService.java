package com.example.minidiscord.service;

import com.example.minidiscord.dto.ChannelDTO;
import com.example.minidiscord.dto.CreateChannelRequest;
import com.example.minidiscord.exception.BadRequestException;
import com.example.minidiscord.exception.NotFoundException;
import com.example.minidiscord.repository.ChannelRepository;
import com.example.minidiscord.schema.Channel;
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
        if (request == null || request.getName() == null || request.getName().isBlank()) {
            throw new BadRequestException("Tên channel không được để trống");
        }

        Channel.ChannelType type = Channel.ChannelType.valueOf(
            request.getType() != null ? request.getType().toUpperCase() : "TEXT"
        );
        Channel channel = new Channel(serverId, normalizeChannelName(request.getName()), type);
        channel = channelRepository.save(channel);
        return toDTO(channel);
    }

    public List<ChannelDTO> getChannelsByServer(String serverId) {
        return channelRepository.findByServerId(serverId)
            .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public void deleteChannel(String channelId, String serverId) {
        Channel channel = getChannelOrThrow(channelId);
        if (!channel.getServerId().equals(serverId)) {
            throw new NotFoundException("Channel không thuộc server này");
        }
        channelRepository.deleteById(channelId);
    }

    public Optional<Channel> findById(String channelId) {
        return channelRepository.findById(channelId);
    }

    public Channel getChannelOrThrow(String channelId) {
        return channelRepository.findById(channelId)
            .orElseThrow(() -> new NotFoundException("Channel không tồn tại"));
    }

    public ChannelDTO updateChannel(String channelId, String serverId, CreateChannelRequest request) {
        Channel channel = getChannelOrThrow(channelId);
        if (!channel.getServerId().equals(serverId)) {
            throw new NotFoundException("Channel không thuộc server này");
        }
        if (request != null && request.getName() != null && !request.getName().isBlank()) {
            channel.setName(normalizeChannelName(request.getName()));
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

    private String normalizeChannelName(String name) {
        return name.trim().toLowerCase().replace(" ", "-");
    }
}
