package com.example.minidiscord.service;

import com.example.minidiscord.dto.MentionNotificationDTO;
import com.example.minidiscord.dto.MessageDTO;
import com.example.minidiscord.dto.ServerUnreadSummaryDTO;
import com.example.minidiscord.dto.UnreadChannelSummaryDTO;
import com.example.minidiscord.dto.UnreadSnapshotDTO;
import com.example.minidiscord.dto.UserRealtimeUpdateDTO;
import com.example.minidiscord.repository.ChannelRepository;
import com.example.minidiscord.repository.ChannelUnreadStateRepository;
import com.example.minidiscord.repository.MentionNotificationRepository;
import com.example.minidiscord.repository.ServerRepository;
import com.example.minidiscord.repository.UserRepository;
import com.example.minidiscord.schema.Channel;
import com.example.minidiscord.schema.ChannelUnreadState;
import com.example.minidiscord.schema.MentionNotification;
import com.example.minidiscord.schema.Server;
import com.example.minidiscord.schema.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UnreadNotificationService {
    private final ChannelUnreadStateRepository channelUnreadStateRepository;
    private final MentionNotificationRepository mentionNotificationRepository;
    private final ChannelRepository channelRepository;
    private final ServerRepository serverRepository;
    private final UserRepository userRepository;
    private final ServerService serverService;

    public List<UserRealtimeUpdateDTO> applyMessageSideEffects(MessageDTO message, String senderId) {
        Channel channel = channelRepository.findById(message.getChannelId())
            .orElseThrow(() -> new RuntimeException("Channel không tồn tại"));
        Server server = serverRepository.findById(channel.getServerId())
            .orElseThrow(() -> new RuntimeException("Server không tồn tại"));

        Set<String> mentionTargetIds = new HashSet<>(message.getMentionedUserIds() != null
            ? message.getMentionedUserIds()
            : List.of());
        mentionTargetIds.remove(senderId);

        LocalDateTime messageTime = message.getCreatedAt() != null ? message.getCreatedAt() : LocalDateTime.now();
        List<UserRealtimeUpdateDTO> updates = new ArrayList<>();

        for (String memberId : getServerMemberIds(server)) {
            if (memberId.equals(senderId)) {
                continue;
            }

            boolean isMentioned = mentionTargetIds.contains(memberId);
            ChannelUnreadState unreadState = channelUnreadStateRepository.findByUserIdAndChannelId(memberId, channel.getId())
                .orElse(new ChannelUnreadState(memberId, server.getId(), channel.getId()));

            unreadState.setServerId(server.getId());
            unreadState.setUnreadCount(unreadState.getUnreadCount() + 1);
            if (isMentioned) {
                unreadState.setMentionCount(unreadState.getMentionCount() + 1);
            }
            unreadState.setLastMessageId(message.getId());
            unreadState.setLastMessageAt(messageTime);
            unreadState.setUpdatedAt(LocalDateTime.now());
            channelUnreadStateRepository.save(unreadState);

            MentionNotificationDTO mentionNotificationDTO = null;
            if (isMentioned) {
                MentionNotification notification = new MentionNotification(
                    memberId,
                    server.getId(),
                    channel.getId(),
                    message.getId(),
                    senderId,
                    previewContent(message.getContent()),
                    messageTime
                );
                mentionNotificationDTO = toNotificationDTO(mentionNotificationRepository.save(notification));
            }

            Optional<User> targetUser = userRepository.findById(memberId);
            if (targetUser.isEmpty() || targetUser.get().getGoogleId() == null) {
                continue;
            }

            updates.add(new UserRealtimeUpdateDTO(
                targetUser.get().getGoogleId(),
                getUnreadSnapshot(memberId),
                mentionNotificationDTO
            ));
        }

        return updates;
    }

    public UnreadSnapshotDTO getUnreadSnapshot(String userId) {
        List<ChannelUnreadState> unreadStates = channelUnreadStateRepository.findByUserId(userId);
        List<ChannelUnreadState> nonZeroStates = unreadStates.stream()
            .filter(this::hasUnread)
            .collect(Collectors.toList());

        List<UnreadChannelSummaryDTO> channelSummaries = toChannelSummaries(nonZeroStates);
        List<ServerUnreadSummaryDTO> serverSummaries = toServerSummaries(channelSummaries);

        long totalUnread = channelSummaries.stream().mapToLong(UnreadChannelSummaryDTO::getUnreadCount).sum();
        long totalMentions = channelSummaries.stream().mapToLong(UnreadChannelSummaryDTO::getMentionCount).sum();
        long unreadNotifications = mentionNotificationRepository.countByUserIdAndRead(userId, false);

        return new UnreadSnapshotDTO(
            totalUnread,
            totalMentions,
            unreadNotifications,
            channelSummaries,
            serverSummaries
        );
    }

    public ServerUnreadSummaryDTO getServerUnreadSummary(String userId, String serverId) {
        validateServerMembership(serverId, userId);

        List<Channel> channels = channelRepository.findByServerId(serverId);
        Map<String, ChannelUnreadState> stateByChannelId = channelUnreadStateRepository.findByUserIdAndServerId(userId, serverId)
            .stream()
            .collect(Collectors.toMap(ChannelUnreadState::getChannelId, state -> state, (left, right) -> left));

        List<UnreadChannelSummaryDTO> summaries = channels.stream()
            .map(channel -> {
                ChannelUnreadState state = stateByChannelId.get(channel.getId());
                return new UnreadChannelSummaryDTO(
                    serverId,
                    channel.getId(),
                    channel.getName(),
                    state != null ? state.getUnreadCount() : 0,
                    state != null ? state.getMentionCount() : 0,
                    state != null ? state.getLastMessageId() : null,
                    state != null ? state.getLastMessageAt() : null
                );
            })
            .sorted(byLastMessageTimeDesc())
            .collect(Collectors.toList());

        long unreadCount = summaries.stream().mapToLong(UnreadChannelSummaryDTO::getUnreadCount).sum();
        long mentionCount = summaries.stream().mapToLong(UnreadChannelSummaryDTO::getMentionCount).sum();

        return new ServerUnreadSummaryDTO(serverId, unreadCount, mentionCount, summaries);
    }

    public UnreadSnapshotDTO markChannelRead(String userId, String channelId) {
        Channel channel = channelRepository.findById(channelId)
            .orElseThrow(() -> new RuntimeException("Channel không tồn tại"));
        validateServerMembership(channel.getServerId(), userId);

        ChannelUnreadState unreadState = channelUnreadStateRepository.findByUserIdAndChannelId(userId, channelId)
            .orElse(new ChannelUnreadState(userId, channel.getServerId(), channelId));

        unreadState.setServerId(channel.getServerId());
        unreadState.setUnreadCount(0);
        unreadState.setMentionCount(0);
        unreadState.setLastReadAt(LocalDateTime.now());
        unreadState.setUpdatedAt(LocalDateTime.now());
        channelUnreadStateRepository.save(unreadState);

        return getUnreadSnapshot(userId);
    }

    public List<MentionNotificationDTO> getNotifications(String userId, boolean unreadOnly) {
        List<MentionNotification> notifications = unreadOnly
            ? mentionNotificationRepository.findByUserIdAndReadOrderByCreatedAtDesc(userId, false)
            : mentionNotificationRepository.findByUserIdOrderByCreatedAtDesc(userId);

        return notifications.stream().map(this::toNotificationDTO).collect(Collectors.toList());
    }

    public MentionNotificationDTO markNotificationRead(String userId, String notificationId) {
        MentionNotification notification = mentionNotificationRepository.findByIdAndUserId(notificationId, userId)
            .orElseThrow(() -> new RuntimeException("Notification không tồn tại"));

        notification.setRead(true);
        notification.setReadAt(LocalDateTime.now());
        return toNotificationDTO(mentionNotificationRepository.save(notification));
    }

    private void validateServerMembership(String serverId, String userId) {
        serverService.requireMembership(serverId, userId);
    }

    private List<String> getServerMemberIds(Server server) {
        return server.getMembers().stream().map(member -> member.getUserId()).collect(Collectors.toList());
    }

    private List<UnreadChannelSummaryDTO> toChannelSummaries(List<ChannelUnreadState> states) {
        Set<String> channelIds = states.stream().map(ChannelUnreadState::getChannelId).collect(Collectors.toSet());
        Map<String, Channel> channelsById = channelRepository.findAllById(channelIds).stream()
            .collect(Collectors.toMap(Channel::getId, channel -> channel));

        return states.stream()
            .map(state -> {
                Channel channel = channelsById.get(state.getChannelId());
                return new UnreadChannelSummaryDTO(
                    state.getServerId(),
                    state.getChannelId(),
                    channel != null ? channel.getName() : null,
                    state.getUnreadCount(),
                    state.getMentionCount(),
                    state.getLastMessageId(),
                    state.getLastMessageAt()
                );
            })
            .sorted(byLastMessageTimeDesc())
            .collect(Collectors.toList());
    }

    private List<ServerUnreadSummaryDTO> toServerSummaries(List<UnreadChannelSummaryDTO> channels) {
        Map<String, List<UnreadChannelSummaryDTO>> channelsByServer = new HashMap<>();
        for (UnreadChannelSummaryDTO channel : channels) {
            channelsByServer.computeIfAbsent(channel.getServerId(), ignored -> new ArrayList<>()).add(channel);
        }

        List<ServerUnreadSummaryDTO> serverSummaries = new ArrayList<>();
        for (Map.Entry<String, List<UnreadChannelSummaryDTO>> entry : channelsByServer.entrySet()) {
            List<UnreadChannelSummaryDTO> serverChannels = entry.getValue().stream()
                .sorted(byLastMessageTimeDesc())
                .collect(Collectors.toList());

            long unreadCount = serverChannels.stream().mapToLong(UnreadChannelSummaryDTO::getUnreadCount).sum();
            long mentionCount = serverChannels.stream().mapToLong(UnreadChannelSummaryDTO::getMentionCount).sum();

            serverSummaries.add(new ServerUnreadSummaryDTO(
                entry.getKey(),
                unreadCount,
                mentionCount,
                serverChannels
            ));
        }

        serverSummaries.sort((left, right) -> {
            LocalDateTime leftLatest = latestMessageAt(left.getChannels());
            LocalDateTime rightLatest = latestMessageAt(right.getChannels());
            return rightLatest.compareTo(leftLatest);
        });

        return serverSummaries;
    }

    private LocalDateTime latestMessageAt(List<UnreadChannelSummaryDTO> channels) {
        return channels.stream()
            .map(UnreadChannelSummaryDTO::getLastMessageAt)
            .filter(value -> value != null)
            .max(LocalDateTime::compareTo)
            .orElse(LocalDateTime.MIN);
    }

    private Comparator<UnreadChannelSummaryDTO> byLastMessageTimeDesc() {
        return (left, right) -> {
            LocalDateTime leftTime = left.getLastMessageAt() != null ? left.getLastMessageAt() : LocalDateTime.MIN;
            LocalDateTime rightTime = right.getLastMessageAt() != null ? right.getLastMessageAt() : LocalDateTime.MIN;
            return rightTime.compareTo(leftTime);
        };
    }

    private boolean hasUnread(ChannelUnreadState state) {
        return state.getUnreadCount() > 0 || state.getMentionCount() > 0;
    }

    private MentionNotificationDTO toNotificationDTO(MentionNotification notification) {
        User sender = userRepository.findById(notification.getSenderId()).orElse(null);
        return new MentionNotificationDTO(
            notification.getId(),
            notification.getUserId(),
            notification.getServerId(),
            notification.getChannelId(),
            notification.getMessageId(),
            notification.getSenderId(),
            sender != null ? sender.getDisplayName() : "Unknown",
            sender != null ? sender.getAvatarUrl() : null,
            notification.getPreview(),
            notification.isRead(),
            notification.getCreatedAt(),
            notification.getReadAt()
        );
    }

    private String previewContent(String content) {
        if (content == null || content.isBlank()) {
            return "";
        }
        String normalized = content.replaceAll("\\s+", " ").trim();
        int maxLength = 140;
        if (normalized.length() <= maxLength) {
            return normalized;
        }
        return normalized.substring(0, maxLength) + "...";
    }
}
