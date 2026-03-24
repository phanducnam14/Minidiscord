import React from 'react';
import useToastStore from '../../store/useToastStore';
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
  const { toasts, removeToast } = useToastStore();

  const isVoice = currentChannel?.type === 'VOICE';

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative' }}>
      {/* Toast Container */}
      <div style={{
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'none'
      }}>
        {toasts.map(toast => (
          <div 
            key={toast.id}
            style={{
              background: '#232428',
              color: 'white',
              padding: '12px 20px',
              borderRadius: '8px',
              boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
              borderLeft: '4px solid var(--discord-blurple)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              pointerEvents: 'auto',
              animation: 'toastIn 0.3s ease-out'
            }}
          >
            <span>{toast.type === 'info' ? 'ℹ️' : '🔔'}</span>
            <span style={{ fontSize: 14 }}>{toast.message}</span>
            <button 
              onClick={() => removeToast(toast.id)}
              style={{ background: 'none', border: 'none', color: '#b5bac1', cursor: 'pointer', fontSize: 18, marginLeft: 8 }}
            >×</button>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes toastIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>

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
