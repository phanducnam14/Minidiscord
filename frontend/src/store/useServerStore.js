import { create } from 'zustand';

const useServerStore = create((set, get) => ({
  servers: [],
  currentServer: null,
  channels: [],
  currentChannel: null,
  isLoadingServers: false,
  isLoadingChannels: false,

  setServers: (servers) => set({ servers }),
  addServer: (server) => set((state) => ({ servers: [...state.servers, server] })),
  updateServer: (updated) => set((state) => {
    const isCurrent = state.currentServer?.id === updated.id;
    return {
      servers: state.servers.map((s) => s.id === updated.id ? updated : s),
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

  setCurrentServer: (server) => set({ currentServer: server, channels: [], currentChannel: null }),

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
