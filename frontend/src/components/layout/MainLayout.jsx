import React from 'react';
import ServerList from './ServerList';
import ChannelSidebar from './ChannelSidebar';
import ChatArea from '../chat/ChatArea';
import VoiceChannel from '../voice/VoiceChannel';
import useServerStore from '../../store/useServerStore';

/**
 * Layout 3 cột chính: ServerList | ChannelSidebar | Content
 */
const MainLayout = ({ wsHook, webRTCHook }) => {
  const { currentChannel } = useServerStore();

  const isVoice = currentChannel?.type === 'VOICE';

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Cột 1: Danh sách server (72px) */}
      <ServerList />

      {/* Cột 2: Channel sidebar (240px) */}
      <ChannelSidebar wsHook={wsHook} webRTCHook={webRTCHook} />

      {/* Cột 3: Nội dung chính */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--discord-channel-bg)', overflow: 'hidden' }}>
        {currentChannel ? (
          isVoice ? (
            <VoiceChannel webRTCHook={webRTCHook} />
          ) : (
            <ChatArea wsHook={wsHook} />
          )
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 16,
            color: 'var(--discord-text-muted)',
          }}>
            <span style={{ fontSize: 80 }}>🎮</span>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--discord-text-primary)' }}>
              Chào mừng đến MiniDiscord
            </h2>
            <p>Chọn một channel để bắt đầu trò chuyện</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainLayout;
