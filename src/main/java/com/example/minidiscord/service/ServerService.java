package com.example.minidiscord.service;

import com.example.minidiscord.dto.CreateServerRequest;
import com.example.minidiscord.dto.MemberDTO;
import com.example.minidiscord.dto.ServerDTO;
import com.example.minidiscord.schema.Server;
import com.example.minidiscord.schema.ServerMember;
import com.example.minidiscord.schema.User;
import com.example.minidiscord.repository.ServerRepository;
import com.example.minidiscord.repository.UserRepository;
import com.example.minidiscord.repository.ChannelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServerService {
    private final ServerRepository serverRepository;
    private final UserRepository userRepository;
    private final ChannelRepository channelRepository;

    /**
     * Tạo server mới, người tạo tự động thành OWNER
     */
    public ServerDTO createServer(CreateServerRequest request, String ownerId) {
        Server server = new Server(request.getName(), request.getIconUrl(), ownerId);
        server = serverRepository.save(server);
        return toDTO(server);
    }

    /**
     * Lấy danh sách server mà user là thành viên
     */
    public List<ServerDTO> getMyServers(String userId) {
        return serverRepository.findByMemberUserId(userId)
            .stream().map(this::toDTO).collect(Collectors.toList());
    }

    /**
     * User tham gia server (thêm với role MEMBER)
     */
    public ServerDTO joinServer(String serverId, String userId) {
        Server server = serverRepository.findById(serverId)
            .orElseThrow(() -> new RuntimeException("Server không tồn tại"));

        // Kiểm tra đã là thành viên chưa
        boolean alreadyMember = server.getMembers().stream()
            .anyMatch(m -> m.getUserId().equals(userId));
        if (alreadyMember) {
            return toDTO(server);
        }

        ServerMember member = new ServerMember(userId, ServerMember.Role.MEMBER, LocalDateTime.now());
        server.getMembers().add(member);
        return toDTO(serverRepository.save(server));
    }

    /**
     * Lấy danh sách thành viên của server kèm thông tin user
     */
    public List<MemberDTO> getMembers(String serverId) {
        Server server = serverRepository.findById(serverId)
            .orElseThrow(() -> new RuntimeException("Server không tồn tại"));

        return server.getMembers().stream().map(m -> {
            User user = userRepository.findById(m.getUserId()).orElse(null);
            return new MemberDTO(
                m.getUserId(),
                user != null ? user.getDisplayName() : "Unknown",
                user != null ? user.getAvatarUrl() : null,
                m.getRole().name(),
                m.getJoinedAt()
            );
        }).collect(Collectors.toList());
    }

    public Optional<Server> findById(String serverId) {
        return serverRepository.findById(serverId);
    }

    public ServerDTO getServer(String serverId) {
        Server server = serverRepository.findById(serverId)
            .orElseThrow(() -> new RuntimeException("Server không tồn tại"));
        return toDTO(server);
    }

    public ServerDTO updateServer(String serverId, CreateServerRequest request) {
        Server server = serverRepository.findById(serverId)
            .orElseThrow(() -> new RuntimeException("Server không tồn tại"));
        if (request.getName() != null && !request.getName().isBlank()) {
            server.setName(request.getName().trim());
        }
        if (request.getIconUrl() != null) {
            server.setIconUrl(request.getIconUrl());
        }
        return toDTO(serverRepository.save(server));
    }

    public boolean deleteServer(String serverId) {
        if (serverRepository.existsById(serverId)) {
            serverRepository.deleteById(serverId);
            channelRepository.deleteByServerId(serverId);
            return true;
        }
        return false;
    }

    /**
     * Kiểm tra user có phải OWNER hoặc ADMIN không
     */
    public boolean isOwnerOrAdmin(String serverId, String userId) {
        return serverRepository.findById(serverId).map(server ->
            server.getMembers().stream().anyMatch(m ->
                m.getUserId().equals(userId) &&
                (m.getRole() == ServerMember.Role.OWNER || m.getRole() == ServerMember.Role.ADMIN)
            )
        ).orElse(false);
    }

    /**
     * Kiểm tra user có phải là thành viên của server không
     */
    public boolean isMember(String serverId, String userId) {
        return serverRepository.findById(serverId).map(server ->
            server.getMembers().stream().anyMatch(m -> m.getUserId().equals(userId))
        ).orElse(false);
    }

    private ServerDTO toDTO(Server server) {
        List<MemberDTO> memberList = server.getMembers().stream().map(m -> {
            User user = userRepository.findById(m.getUserId()).orElse(null);
            return new MemberDTO(
                m.getUserId(),
                user != null ? user.getDisplayName() : "Unknown",
                user != null ? user.getAvatarUrl() : null,
                m.getRole().name(),
                m.getJoinedAt()
            );
        }).collect(Collectors.toList());

        return new ServerDTO(
            server.getId(),
            server.getName(),
            server.getIconUrl(),
            server.getOwnerId(),
            memberList,
            server.getCreatedAt()
        );
    }
}
