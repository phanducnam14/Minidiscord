package com.example.minidiscord.service;

import com.example.minidiscord.dto.CreateServerRequest;
import com.example.minidiscord.dto.MemberDTO;
import com.example.minidiscord.dto.RoleDTO;
import com.example.minidiscord.dto.ServerDTO;
import com.example.minidiscord.dto.UpdateMemberRolesRequest;
import com.example.minidiscord.dto.UpsertRoleRequest;
import com.example.minidiscord.exception.BadRequestException;
import com.example.minidiscord.exception.ForbiddenException;
import com.example.minidiscord.exception.NotFoundException;
import com.example.minidiscord.repository.ChannelRepository;
import com.example.minidiscord.repository.ServerRepository;
import com.example.minidiscord.repository.UserRepository;
import com.example.minidiscord.schema.Channel;
import com.example.minidiscord.schema.Server;
import com.example.minidiscord.schema.ServerMember;
import com.example.minidiscord.schema.ServerPermission;
import com.example.minidiscord.schema.ServerRole;
import com.example.minidiscord.schema.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServerService {
    public static final String OWNER_ROLE_ID = "owner";
    public static final String ADMIN_ROLE_ID = "admin";
    public static final String MEMBER_ROLE_ID = "member";

    private static final Set<ServerPermission> OWNER_PERMISSIONS = EnumSet.allOf(ServerPermission.class);
    private static final Set<ServerPermission> ADMIN_PERMISSIONS = EnumSet.of(
        ServerPermission.SERVER_VIEW,
        ServerPermission.SERVER_UPDATE,
        ServerPermission.MEMBER_VIEW,
        ServerPermission.MEMBER_MANAGE,
        ServerPermission.ROLE_VIEW,
        ServerPermission.ROLE_MANAGE,
        ServerPermission.CHANNEL_VIEW,
        ServerPermission.CHANNEL_CREATE,
        ServerPermission.CHANNEL_UPDATE,
        ServerPermission.CHANNEL_DELETE,
        ServerPermission.MESSAGE_VIEW,
        ServerPermission.MESSAGE_SEND,
        ServerPermission.MESSAGE_REACT,
        ServerPermission.MESSAGE_MANAGE,
        ServerPermission.VOICE_CONNECT
    );
    private static final Set<ServerPermission> MEMBER_PERMISSIONS = EnumSet.of(
        ServerPermission.SERVER_VIEW,
        ServerPermission.MEMBER_VIEW,
        ServerPermission.ROLE_VIEW,
        ServerPermission.CHANNEL_VIEW,
        ServerPermission.MESSAGE_VIEW,
        ServerPermission.MESSAGE_SEND,
        ServerPermission.MESSAGE_REACT,
        ServerPermission.VOICE_CONNECT
    );

    private final ServerRepository serverRepository;
    private final UserRepository userRepository;
    private final ChannelRepository channelRepository;

    public ServerDTO createServer(CreateServerRequest request, String ownerId) {
        Server server = new Server(request.getName(), request.getIconUrl(), ownerId);
        normalizeServer(server);
        server = serverRepository.save(server);
        return toDTO(server, ownerId);
    }

    public List<ServerDTO> getMyServers(String userId) {
        return serverRepository.findByMemberUserId(userId)
            .stream()
            .map(server -> toDTO(server, userId))
            .collect(Collectors.toList());
    }

    public ServerDTO joinServer(String serverId, String userId) {
        Server server = getServerOrThrow(serverId);
        normalizeServer(server);

        boolean alreadyMember = server.getMembers().stream().anyMatch(member -> member.getUserId().equals(userId));
        if (alreadyMember) {
            return toDTO(server, userId);
        }

        ServerMember member = new ServerMember(
            userId,
            List.of(MEMBER_ROLE_ID),
            LocalDateTime.now()
        );
        member.setRole(ServerMember.Role.MEMBER);
        server.getMembers().add(member);
        server = serverRepository.save(server);
        return toDTO(server, userId);
    }

    public List<MemberDTO> getMembers(String serverId, String requesterId) {
        Server server = requirePermission(serverId, requesterId, ServerPermission.MEMBER_VIEW);
        return toMemberDTOs(server);
    }

    public ServerDTO getServer(String serverId, String requesterId) {
        Server server = requirePermission(serverId, requesterId, ServerPermission.SERVER_VIEW);
        return toDTO(server, requesterId);
    }

    public ServerDTO updateServer(String serverId, CreateServerRequest request, String requesterId) {
        Server server = requirePermission(serverId, requesterId, ServerPermission.SERVER_UPDATE);
        if (request.getName() != null && !request.getName().isBlank()) {
            server.setName(request.getName().trim());
        }
        if (request.getIconUrl() != null) {
            server.setIconUrl(request.getIconUrl());
        }
        server = serverRepository.save(server);
        return toDTO(server, requesterId);
    }

    public boolean deleteServer(String serverId, String requesterId) {
        Server server = getServerOrThrow(serverId);
        if (!server.getOwnerId().equals(requesterId)) {
            throw new ForbiddenException("Chỉ owner mới được xóa server");
        }
        channelRepository.deleteByServerId(serverId);
        serverRepository.deleteById(serverId);
        return true;
    }

    public ServerDTO leaveServer(String serverId, String requesterId) {
        Server server = requirePermission(serverId, requesterId, ServerPermission.SERVER_VIEW);
        if (server.getOwnerId().equals(requesterId)) {
            throw new BadRequestException("Owner không thể rời server. Hãy xóa server hoặc chuyển owner trước");
        }

        boolean removed = server.getMembers().removeIf(member -> member.getUserId().equals(requesterId));
        if (!removed) {
            throw new NotFoundException("Không tìm thấy thành viên");
        }

        server = serverRepository.save(server);
        return toDTO(server, requesterId);
    }

    public MemberDTO updateMemberRoles(String serverId, String targetUserId, UpdateMemberRolesRequest request, String requesterId) {
        Server server = requirePermission(serverId, requesterId, ServerPermission.MEMBER_MANAGE);

        if (server.getOwnerId().equals(targetUserId)) {
            throw new ForbiddenException("Không thể chỉnh role của owner");
        }

        ServerMember member = findMember(server, targetUserId)
            .orElseThrow(() -> new NotFoundException("Không tìm thấy thành viên"));

        List<String> normalizedRoleIds = normalizeAssignableRoleIds(server, request != null ? request.getRoleIds() : null);
        member.setRoleIds(normalizedRoleIds);
        member.setRole(resolveLegacyRoleFromRoleIds(normalizedRoleIds));

        server = serverRepository.save(server);
        return toMemberDTO(server, member);
    }

    public void removeMember(String serverId, String targetUserId, String requesterId) {
        Server server = requirePermission(serverId, requesterId, ServerPermission.MEMBER_MANAGE);

        if (server.getOwnerId().equals(targetUserId)) {
            throw new ForbiddenException("Không thể xóa owner khỏi server");
        }
        if (requesterId.equals(targetUserId)) {
            throw new BadRequestException("Không thể tự xóa chính mình, hãy dùng API rời server");
        }

        boolean removed = server.getMembers().removeIf(member -> member.getUserId().equals(targetUserId));
        if (!removed) {
            throw new NotFoundException("Không tìm thấy thành viên");
        }

        serverRepository.save(server);
    }

    public List<RoleDTO> getRoles(String serverId, String requesterId) {
        Server server = requirePermission(serverId, requesterId, ServerPermission.ROLE_VIEW);
        return toRoleDTOs(server);
    }

    public RoleDTO createRole(String serverId, UpsertRoleRequest request, String requesterId) {
        Server server = requirePermission(serverId, requesterId, ServerPermission.ROLE_MANAGE);

        String roleName = validateRoleName(request != null ? request.getName() : null);
        ensureRoleNameUnique(server, roleName, null);

        ServerRole role = new ServerRole(
            UUID.randomUUID().toString(),
            roleName,
            parsePermissions(request != null ? request.getPermissions() : null),
            false
        );
        server.getRoles().add(role);
        server = serverRepository.save(server);

        return toRoleDTO(findRole(server, role.getId()).orElse(role));
    }

    public RoleDTO updateRole(String serverId, String roleId, UpsertRoleRequest request, String requesterId) {
        Server server = requirePermission(serverId, requesterId, ServerPermission.ROLE_MANAGE);

        ServerRole role = findRole(server, roleId).orElseThrow(() -> new NotFoundException("Không tìm thấy role"));
        if (role.isSystemRole()) {
            throw new ForbiddenException("Không thể sửa role hệ thống");
        }

        String roleName = validateRoleName(request != null ? request.getName() : null);
        ensureRoleNameUnique(server, roleName, roleId);

        role.setName(roleName);
        role.setPermissions(parsePermissions(request != null ? request.getPermissions() : null));
        role.setUpdatedAt(LocalDateTime.now());

        server = serverRepository.save(server);
        return toRoleDTO(findRole(server, roleId).orElse(role));
    }

    public void deleteRole(String serverId, String roleId, String requesterId) {
        Server server = requirePermission(serverId, requesterId, ServerPermission.ROLE_MANAGE);

        ServerRole role = findRole(server, roleId).orElseThrow(() -> new NotFoundException("Không tìm thấy role"));
        if (role.isSystemRole()) {
            throw new ForbiddenException("Không thể xóa role hệ thống");
        }

        for (ServerMember member : server.getMembers()) {
            List<String> memberRoles = sanitizeRoleIds(member.getRoleIds());
            if (memberRoles.remove(roleId)) {
                if (member.getUserId().equals(server.getOwnerId())) {
                    memberRoles.add(OWNER_ROLE_ID);
                } else if (memberRoles.isEmpty()) {
                    memberRoles.add(MEMBER_ROLE_ID);
                }
                member.setRoleIds(deduplicate(memberRoles));
                member.setRole(resolveLegacyRoleFromRoleIds(member.getRoleIds()));
            }
        }

        server.getRoles().removeIf(item -> item.getId().equals(roleId));
        serverRepository.save(server);
    }

    public Optional<Server> findById(String serverId) {
        return serverRepository.findById(serverId).map(this::normalizeServer);
    }

    public boolean hasPermission(String serverId, String userId, ServerPermission permission) {
        Server server = getServerOrThrow(serverId);
        return hasPermission(server, userId, permission);
    }

    public Server requirePermission(String serverId, String userId, ServerPermission permission) {
        Server server = getServerOrThrow(serverId);
        if (!hasPermission(server, userId, permission)) {
            throw new ForbiddenException("Không có quyền: " + permission.name());
        }
        return server;
    }

    public Server requireMembership(String serverId, String userId) {
        return requirePermission(serverId, userId, ServerPermission.SERVER_VIEW);
    }

    public Channel requireChannelPermission(String channelId, String userId, ServerPermission permission) {
        Channel channel = channelRepository.findById(channelId)
            .orElseThrow(() -> new NotFoundException("Channel không tồn tại"));
        requirePermission(channel.getServerId(), userId, permission);
        return channel;
    }

    public Set<ServerPermission> getEffectivePermissions(Server server, String userId) {
        if (server.getOwnerId().equals(userId)) {
            return EnumSet.allOf(ServerPermission.class);
        }

        ServerMember member = findMember(server, userId).orElse(null);
        if (member == null) {
            return EnumSet.noneOf(ServerPermission.class);
        }

        Set<ServerPermission> effective = EnumSet.noneOf(ServerPermission.class);
        Map<String, ServerRole> roleById = server.getRoles().stream()
            .collect(Collectors.toMap(ServerRole::getId, role -> role, (left, right) -> left, HashMap::new));

        for (String roleId : sanitizeRoleIds(member.getRoleIds())) {
            ServerRole role = roleById.get(roleId);
            if (role != null && role.getPermissions() != null) {
                effective.addAll(role.getPermissions());
            }
        }
        return effective;
    }

    private Server getServerOrThrow(String serverId) {
        return normalizeServer(
            serverRepository.findById(serverId)
                .orElseThrow(() -> new NotFoundException("Server không tồn tại"))
        );
    }

    private Server normalizeServer(Server server) {
        boolean changed = false;

        if (server.getMembers() == null) {
            server.setMembers(new ArrayList<>());
            changed = true;
        }
        if (server.getRoles() == null) {
            server.setRoles(new ArrayList<>());
            changed = true;
        }

        changed = ensureSystemRoles(server) || changed;

        for (ServerMember member : server.getMembers()) {
            if (member.getJoinedAt() == null) {
                member.setJoinedAt(LocalDateTime.now());
                changed = true;
            }

            List<String> normalizedRoleIds = sanitizeRoleIds(member.getRoleIds());
            if (normalizedRoleIds.isEmpty()) {
                normalizedRoleIds = mapLegacyRoleToRoleIds(member.getRole());
            }
            if (normalizedRoleIds.isEmpty()) {
                normalizedRoleIds = new ArrayList<>(List.of(MEMBER_ROLE_ID));
            }

            if (member.getUserId().equals(server.getOwnerId())) {
                if (!normalizedRoleIds.contains(OWNER_ROLE_ID)) {
                    normalizedRoleIds.add(OWNER_ROLE_ID);
                }
                member.setRole(ServerMember.Role.OWNER);
            } else {
                normalizedRoleIds.remove(OWNER_ROLE_ID);
                if (normalizedRoleIds.isEmpty()) {
                    normalizedRoleIds.add(MEMBER_ROLE_ID);
                }
                member.setRole(resolveLegacyRoleFromRoleIds(normalizedRoleIds));
            }

            List<String> deduplicated = deduplicate(normalizedRoleIds);
            if (!deduplicated.equals(member.getRoleIds())) {
                member.setRoleIds(deduplicated);
                changed = true;
            }
        }

        Optional<ServerMember> ownerMemberOpt = findMember(server, server.getOwnerId());
        if (ownerMemberOpt.isEmpty()) {
            ServerMember ownerMember = new ServerMember(
                server.getOwnerId(),
                List.of(OWNER_ROLE_ID),
                LocalDateTime.now()
            );
            ownerMember.setRole(ServerMember.Role.OWNER);
            server.getMembers().add(ownerMember);
            changed = true;
        }

        if (changed && server.getId() != null) {
            return serverRepository.save(server);
        }
        return server;
    }

    private boolean ensureSystemRoles(Server server) {
        Map<String, ServerRole> roleById = server.getRoles().stream()
            .collect(Collectors.toMap(ServerRole::getId, role -> role, (left, right) -> left, HashMap::new));

        boolean changed = false;
        changed = ensureSystemRole(server, roleById, OWNER_ROLE_ID, "Owner", OWNER_PERMISSIONS) || changed;
        changed = ensureSystemRole(server, roleById, ADMIN_ROLE_ID, "Admin", ADMIN_PERMISSIONS) || changed;
        changed = ensureSystemRole(server, roleById, MEMBER_ROLE_ID, "Member", MEMBER_PERMISSIONS) || changed;

        for (ServerRole role : server.getRoles()) {
            if (role.getPermissions() == null) {
                role.setPermissions(new HashSet<>());
                changed = true;
            }
            if (role.getCreatedAt() == null) {
                role.setCreatedAt(LocalDateTime.now());
                changed = true;
            }
            if (role.getUpdatedAt() == null) {
                role.setUpdatedAt(LocalDateTime.now());
                changed = true;
            }
        }
        return changed;
    }

    private boolean ensureSystemRole(
        Server server,
        Map<String, ServerRole> roleById,
        String roleId,
        String roleName,
        Set<ServerPermission> permissions
    ) {
        ServerRole existing = roleById.get(roleId);
        if (existing == null) {
            server.getRoles().add(new ServerRole(roleId, roleName, permissions, true));
            return true;
        }

        boolean changed = false;
        if (!existing.isSystemRole()) {
            existing.setSystemRole(true);
            changed = true;
        }
        if (!permissions.equals(existing.getPermissions())) {
            existing.setPermissions(new HashSet<>(permissions));
            changed = true;
        }
        if (existing.getName() == null || existing.getName().isBlank()) {
            existing.setName(roleName);
            changed = true;
        }
        if (changed) {
            existing.setUpdatedAt(LocalDateTime.now());
        }
        return changed;
    }

    private boolean hasPermission(Server server, String userId, ServerPermission permission) {
        if (server.getOwnerId().equals(userId)) {
            return true;
        }
        return getEffectivePermissions(server, userId).contains(permission);
    }

    private Optional<ServerMember> findMember(Server server, String userId) {
        return server.getMembers().stream()
            .filter(member -> member.getUserId().equals(userId))
            .findFirst();
    }

    private Optional<ServerRole> findRole(Server server, String roleId) {
        return server.getRoles().stream()
            .filter(role -> role.getId().equals(roleId))
            .findFirst();
    }

    private List<MemberDTO> toMemberDTOs(Server server) {
        return server.getMembers().stream()
            .map(member -> toMemberDTO(server, member))
            .sorted(Comparator.comparing(MemberDTO::getJoinedAt))
            .collect(Collectors.toList());
    }

    private MemberDTO toMemberDTO(Server server, ServerMember member) {
        User user = userRepository.findById(member.getUserId()).orElse(null);
        List<String> roleIds = deduplicate(sanitizeRoleIds(member.getRoleIds()));
        String primaryRole = resolveLegacyRoleFromRoleIds(roleIds).name();
        if (server.getOwnerId().equals(member.getUserId())) {
            primaryRole = ServerMember.Role.OWNER.name();
        }

        return new MemberDTO(
            member.getUserId(),
            user != null ? user.getDisplayName() : "Unknown",
            user != null ? user.getAvatarUrl() : null,
            primaryRole,
            roleIds,
            member.getJoinedAt()
        );
    }

    private List<RoleDTO> toRoleDTOs(Server server) {
        return server.getRoles().stream()
            .map(this::toRoleDTO)
            .sorted(Comparator.comparing(RoleDTO::getName, String.CASE_INSENSITIVE_ORDER))
            .collect(Collectors.toList());
    }

    private RoleDTO toRoleDTO(ServerRole role) {
        Set<String> permissions = role.getPermissions() == null
            ? Set.of()
            : role.getPermissions().stream()
                .map(ServerPermission::name)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        return new RoleDTO(
            role.getId(),
            role.getName(),
            permissions,
            role.isSystemRole(),
            role.getCreatedAt(),
            role.getUpdatedAt()
        );
    }

    private ServerDTO toDTO(Server server, String currentUserId) {
        Set<String> currentUserPermissions = getEffectivePermissions(server, currentUserId).stream()
            .map(ServerPermission::name)
            .collect(Collectors.toCollection(LinkedHashSet::new));

        return new ServerDTO(
            server.getId(),
            server.getName(),
            server.getIconUrl(),
            server.getOwnerId(),
            toMemberDTOs(server),
            toRoleDTOs(server),
            currentUserPermissions,
            server.getCreatedAt()
        );
    }

    private List<String> mapLegacyRoleToRoleIds(ServerMember.Role role) {
        if (role == null) {
            return new ArrayList<>();
        }
        return switch (role) {
            case OWNER -> new ArrayList<>(List.of(OWNER_ROLE_ID));
            case ADMIN -> new ArrayList<>(List.of(ADMIN_ROLE_ID));
            case MEMBER -> new ArrayList<>(List.of(MEMBER_ROLE_ID));
        };
    }

    private List<String> normalizeAssignableRoleIds(Server server, List<String> requestedRoleIds) {
        List<String> roleIds = sanitizeRoleIds(requestedRoleIds);
        if (roleIds.isEmpty()) {
            return List.of(MEMBER_ROLE_ID);
        }

        Set<String> validRoleIds = server.getRoles().stream()
            .map(ServerRole::getId)
            .collect(Collectors.toSet());

        for (String roleId : roleIds) {
            if (!validRoleIds.contains(roleId)) {
                throw new BadRequestException("Role không tồn tại: " + roleId);
            }
            if (OWNER_ROLE_ID.equals(roleId)) {
                throw new ForbiddenException("Không thể gán role owner");
            }
        }
        return deduplicate(roleIds);
    }

    private List<String> sanitizeRoleIds(List<String> roleIds) {
        if (roleIds == null) {
            return new ArrayList<>();
        }
        return roleIds.stream()
            .filter(value -> value != null && !value.isBlank())
            .map(String::trim)
            .collect(Collectors.toList());
    }

    private List<String> deduplicate(List<String> values) {
        return new ArrayList<>(new LinkedHashSet<>(values));
    }

    private ServerMember.Role resolveLegacyRoleFromRoleIds(List<String> roleIds) {
        if (roleIds == null || roleIds.isEmpty()) {
            return ServerMember.Role.MEMBER;
        }
        if (roleIds.contains(OWNER_ROLE_ID)) {
            return ServerMember.Role.OWNER;
        }
        if (roleIds.contains(ADMIN_ROLE_ID)) {
            return ServerMember.Role.ADMIN;
        }
        return ServerMember.Role.MEMBER;
    }

    private String validateRoleName(String name) {
        if (name == null || name.isBlank()) {
            throw new BadRequestException("Tên role không được để trống");
        }
        return name.trim();
    }

    private void ensureRoleNameUnique(Server server, String roleName, String roleIdToExclude) {
        String normalized = roleName.toLowerCase(Locale.ROOT);
        boolean exists = server.getRoles().stream().anyMatch(role -> {
            if (roleIdToExclude != null && roleIdToExclude.equals(role.getId())) {
                return false;
            }
            return role.getName() != null && role.getName().trim().toLowerCase(Locale.ROOT).equals(normalized);
        });
        if (exists) {
            throw new BadRequestException("Tên role đã tồn tại");
        }
    }

    private Set<ServerPermission> parsePermissions(Set<String> permissionNames) {
        if (permissionNames == null) {
            return new HashSet<>();
        }

        Set<ServerPermission> permissions = EnumSet.noneOf(ServerPermission.class);
        for (String name : permissionNames) {
            if (name == null || name.isBlank()) {
                continue;
            }
            try {
                permissions.add(ServerPermission.valueOf(name.trim().toUpperCase(Locale.ROOT)));
            } catch (IllegalArgumentException ex) {
                throw new BadRequestException(
                    "Permission không hợp lệ: " + name + ". Hợp lệ: " + Arrays.toString(ServerPermission.values())
                );
            }
        }
        return permissions;
    }
}
