import React, { useMemo } from 'react';
import useServerStore from '../../store/useServerStore';
import useUnreadStore from '../../store/useUnreadStore';
import {
  buildMemberDirectory,
  createDisplayNameResolver,
  replaceMentionTokens,
} from '../../utils/mentionUtils';

const NotificationPanel = ({ onOpenNotification, onMarkRead }) => {
  const { servers, channels, currentServer } = useServerStore();
  const notifications = useUnreadStore((state) => state.notifications);
  const unreadNotificationCount = useUnreadStore((state) => state.snapshot.unreadNotificationCount);
  const unreadChannels = useUnreadStore((state) => state.snapshot.channels);

  const notificationItems = notifications.slice(0, 6);

  const serverNameById = useMemo(
    () => new Map(servers.map((server) => [server.id, server.name])),
    [servers]
  );
  const channelNameById = useMemo(() => {
    const pairs = [
      ...unreadChannels.map((channel) => [channel.channelId, channel.channelName]),
      ...channels.map((channel) => [channel.id, channel.name]),
    ];

    return new Map(pairs);
  }, [channels, unreadChannels]);
  const memberDirectory = useMemo(
    () => buildMemberDirectory(currentServer?.members || [], null),
    [currentServer?.members]
  );
  const resolveDisplayName = useMemo(
    () => createDisplayNameResolver(memberDirectory),
    [memberDirectory]
  );

  if (!notificationItems.length) {
    return null;
  }

  return (
    <aside className="notification-panel animate-fade-in">
      <div className="notification-panel__header">
        <div>
          <div className="notification-panel__eyebrow">Mentions</div>
          <div className="notification-panel__title">Hoat dong cua ban</div>
        </div>
        {unreadNotificationCount > 0 && (
          <span className="nav-badge nav-badge--mention">{unreadNotificationCount}</span>
        )}
      </div>

      <div className="notification-panel__list">
        {notificationItems.map((notification) => {
          const serverName = serverNameById.get(notification.serverId) || 'Server';
          const channelName = channelNameById.get(notification.channelId) || notification.channelId;
          const preview = replaceMentionTokens(notification.preview || '', resolveDisplayName);

          return (
            <div
              key={notification.id}
              className={`notification-item ${notification.read ? '' : 'is-unread'}`}
            >
              <button
                type="button"
                onClick={() => onOpenNotification?.(notification)}
                className="notification-item__body"
              >
                <img
                  src={notification.senderAvatar || 'https://via.placeholder.com/36'}
                  alt={notification.senderName}
                  className="avatar notification-item__avatar"
                />
                <span className="notification-item__meta">
                  <span className="notification-item__topline">
                    <span className="notification-item__sender">{notification.senderName}</span>
                    {!notification.read && <span className="notification-item__pulse" />}
                  </span>
                  <span className="notification-item__location">{serverName} · #{channelName}</span>
                  <span className="notification-item__preview">{preview || 'Mo de xem tin nhan moi.'}</span>
                  <span className="notification-item__time">{formatNotificationTime(notification.createdAt)}</span>
                </span>
              </button>

              {!notification.read && (
                <button
                  type="button"
                  onClick={() => onMarkRead?.(notification.id)}
                  className="notification-item__mark-read"
                  aria-label="Danh dau da doc"
                  title="Danh dau da doc"
                >
                  <CheckIcon />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};

const formatNotificationTime = (timestamp) => {
  if (!timestamp) {
    return '';
  }

  const date = new Date(timestamp);
  const now = Date.now();
  const deltaMinutes = Math.round((now - date.getTime()) / 60000);

  if (deltaMinutes < 1) {
    return 'Vua xong';
  }

  if (deltaMinutes < 60) {
    return `${deltaMinutes} phut truoc`;
  }

  if (deltaMinutes < 24 * 60) {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }

  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
};

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m5 13 4 4L19 7" />
  </svg>
);

export default NotificationPanel;
