import { create } from 'zustand';

const emptySnapshot = () => ({
  totalUnreadCount: 0,
  totalMentionCount: 0,
  unreadNotificationCount: 0,
  channels: [],
  servers: [],
});

const sortByNewest = (left, right) => {
  const leftTime = left?.createdAt ? new Date(left.createdAt).getTime() : 0;
  const rightTime = right?.createdAt ? new Date(right.createdAt).getTime() : 0;
  return rightTime - leftTime;
};

const sortChannelSummaries = (channels = []) => (
  [...channels].sort((left, right) => {
    const rightTime = right?.lastMessageAt ? new Date(right.lastMessageAt).getTime() : 0;
    const leftTime = left?.lastMessageAt ? new Date(left.lastMessageAt).getTime() : 0;

    if (rightTime !== leftTime) {
      return rightTime - leftTime;
    }

    return (left?.channelName || '').localeCompare(right?.channelName || '');
  })
);

const sortServerSummaries = (servers = []) => (
  [...servers].sort((left, right) => {
    const mentionDelta = (right?.mentionCount || 0) - (left?.mentionCount || 0);
    if (mentionDelta !== 0) {
      return mentionDelta;
    }

    const unreadDelta = (right?.unreadCount || 0) - (left?.unreadCount || 0);
    if (unreadDelta !== 0) {
      return unreadDelta;
    }

    return (left?.serverId || '').localeCompare(right?.serverId || '');
  })
);

const normalizeSnapshot = (snapshot) => {
  const nextSnapshot = snapshot || emptySnapshot();

  return {
    totalUnreadCount: Number(nextSnapshot.totalUnreadCount || 0),
    totalMentionCount: Number(nextSnapshot.totalMentionCount || 0),
    unreadNotificationCount: Number(nextSnapshot.unreadNotificationCount || 0),
    channels: sortChannelSummaries(nextSnapshot.channels || []),
    servers: sortServerSummaries(nextSnapshot.servers || []),
  };
};

const recalculateSnapshot = (snapshot) => {
  const channels = sortChannelSummaries(snapshot.channels || []);
  const servers = sortServerSummaries(snapshot.servers || []);

  return {
    ...snapshot,
    channels,
    servers,
    totalUnreadCount: channels.reduce((sum, channel) => sum + Number(channel.unreadCount || 0), 0),
    totalMentionCount: channels.reduce((sum, channel) => sum + Number(channel.mentionCount || 0), 0),
  };
};

const mergeServerSummaryIntoSnapshot = (snapshot, serverSummary) => {
  if (!serverSummary?.serverId) {
    return snapshot;
  }

  const normalizedSummary = {
    serverId: serverSummary.serverId,
    unreadCount: Number(serverSummary.unreadCount || 0),
    mentionCount: Number(serverSummary.mentionCount || 0),
    channels: sortChannelSummaries(serverSummary.channels || []),
  };

  const filteredChannels = (snapshot.channels || []).filter(
    (channel) => channel.serverId !== normalizedSummary.serverId
  );
  const filteredServers = (snapshot.servers || []).filter(
    (server) => server.serverId !== normalizedSummary.serverId
  );

  return recalculateSnapshot({
    ...snapshot,
    channels: [...filteredChannels, ...normalizedSummary.channels],
    servers: [...filteredServers, normalizedSummary],
  });
};

const normalizeNotifications = (notifications = []) => (
  [...notifications].sort(sortByNewest)
);

const useUnreadStore = create((set) => ({
  snapshot: emptySnapshot(),
  notifications: [],

  setSnapshot: (snapshot) => set({ snapshot: normalizeSnapshot(snapshot) }),
  mergeServerSummary: (summary) => set((state) => ({
    snapshot: mergeServerSummaryIntoSnapshot(state.snapshot, summary),
  })),
  setNotifications: (notifications) => set({ notifications: normalizeNotifications(notifications) }),
  upsertNotification: (notification) => set((state) => {
    const existing = state.notifications.filter((item) => item.id !== notification?.id);
    return {
      notifications: normalizeNotifications([notification, ...existing].filter(Boolean)),
    };
  }),
  markNotificationReadLocal: (notificationId) => set((state) => {
    const targetNotification = state.notifications.find((notification) => notification.id === notificationId);
    const shouldDecrement = targetNotification && !targetNotification.read;

    return {
      snapshot: {
        ...state.snapshot,
        unreadNotificationCount: shouldDecrement
          ? Math.max(0, Number(state.snapshot.unreadNotificationCount || 0) - 1)
          : state.snapshot.unreadNotificationCount,
      },
      notifications: state.notifications.map((notification) => (
        notification.id === notificationId
          ? {
              ...notification,
              read: true,
              readAt: notification.readAt || new Date().toISOString(),
            }
          : notification
      )),
    };
  }),
  resetUnreadState: () => set({ snapshot: emptySnapshot(), notifications: [] }),
}));

export default useUnreadStore;
