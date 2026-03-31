import { create } from 'zustand';

const replaceServer = (servers, server) => {
  const existingIndex = servers.findIndex((item) => item.id === server.id);

  if (existingIndex === -1) {
    return [...servers, server];
  }

  return servers.map((item) => (item.id === server.id ? server : item));
};

const updateCurrentServerField = (state, updater) => {
  if (!state.currentServer) {
    return {};
  }

  const nextCurrentServer = updater(state.currentServer);

  return {
    currentServer: nextCurrentServer,
    servers: state.servers.map((server) => (
      server.id === nextCurrentServer.id ? nextCurrentServer : server
    )),
  };
};

const useServerStore = create((set) => ({
  servers: [],
  currentServer: null,
  channels: [],
  currentChannel: null,
  isLoadingServers: false,
  isLoadingChannels: false,

  setServers: (servers) => set((state) => ({
    servers,
    currentServer: state.currentServer
      ? servers.find((server) => server.id === state.currentServer.id) || state.currentServer
      : null,
  })),
  addServer: (server) => set((state) => ({
    servers: replaceServer(state.servers, server),
    currentServer: state.currentServer?.id === server.id ? server : state.currentServer,
  })),
  updateServer: (updated) => set((state) => {
    const isCurrent = state.currentServer?.id === updated.id;
    return {
      servers: replaceServer(state.servers, updated),
      currentServer: isCurrent ? updated : state.currentServer,
    };
  }),
  removeServer: (serverId) => set((state) => {
    const isCurrent = state.currentServer?.id === serverId;
    return {
      servers: state.servers.filter((s) => s.id !== serverId),
      currentServer: isCurrent ? null : state.currentServer,
      channels: isCurrent ? [] : state.channels,
      currentChannel: isCurrent ? null : state.currentChannel,
    };
  }),

  setCurrentServer: (server) => set((state) => ({
    currentServer: server ? state.servers.find((item) => item.id === server.id) || server : null,
    channels: [],
    currentChannel: null,
  })),

  updateCurrentServerMembers: (members) => set((state) => updateCurrentServerField(state, (server) => ({
    ...server,
    members,
  }))),
  updateCurrentServerMember: (member) => set((state) => updateCurrentServerField(state, (server) => ({
    ...server,
    members: (server.members || []).some((item) => item.userId === member.userId)
      ? server.members.map((item) => (item.userId === member.userId ? member : item))
      : [...(server.members || []), member],
  }))),
  removeCurrentServerMember: (memberUserId) => set((state) => updateCurrentServerField(state, (server) => ({
    ...server,
    members: (server.members || []).filter((member) => member.userId !== memberUserId),
  }))),
  updateCurrentServerRoles: (roles) => set((state) => updateCurrentServerField(state, (server) => ({
    ...server,
    roles,
  }))),

  setChannels: (channels) => set({ channels }),
  addChannel: (channel) => set((state) => ({ channels: [...state.channels, channel] })),
  updateChannel: (updated) => set((state) => {
    const isCurrent = state.currentChannel?.id === updated.id;
    return {
      channels: state.channels.map((c) => c.id === updated.id ? updated : c),
      currentChannel: isCurrent ? updated : state.currentChannel,
    };
  }),
  removeChannel: (channelId) =>
    set((state) => ({ 
      channels: state.channels.filter((c) => c.id !== channelId),
      currentChannel: state.currentChannel?.id === channelId ? null : state.currentChannel,
    })),

  setCurrentChannel: (channel) => set({ currentChannel: channel }),

  setLoadingServers: (v) => set({ isLoadingServers: v }),
  setLoadingChannels: (v) => set({ isLoadingChannels: v }),
}));

export default useServerStore;
