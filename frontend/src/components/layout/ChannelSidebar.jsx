import React, { useState } from 'react';
import useServerStore from '../../store/useServerStore';
import useUserStore from '../../store/useUserStore';
import CreateChannelModal from '../modals/CreateChannelModal';
import ServerSettingsModal from '../modals/ServerSettingsModal';
import ChannelSettingsModal from '../modals/ChannelSettingsModal';
import InviteModal from '../modals/InviteModal';

/**
 * Sidebar hiển thị danh sách channels nhóm theo TEXT/VOICE
 * Phía dưới có footer thông tin user
 */
const ChannelSidebar = ({ wsHook, webRTCHook }) => {
  const { currentServer, channels, currentChannel, setCurrentChannel, removeChannel } = useServerStore();
  const { currentUser } = useUserStore();
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showServerDropdown, setShowServerDropdown] = useState(false);
  const [showServerSettings, setShowServerSettings] = useState(false);
  const [showChannelSettings, setShowChannelSettings] = useState(null);
  const [showInvite, setShowInvite] = useState(false);

  const { isMicOn, isCamOn, isScreenSharing, toggleMic, toggleCamera, toggleScreenShare, currentChannelId } = webRTCHook || {};


  const textChannels = channels.filter((c) => c.type === 'TEXT');
  const voiceChannels = channels.filter((c) => c.type === 'VOICE');

  // Kiểm tra user có phải OWNER/ADMIN không
  const isAdmin = currentServer?.members?.some(
    (m) => m.userId === currentUser?.id && (m.role === 'OWNER' || m.role === 'ADMIN')
  );

  const handleLeaveVoice = () => {
    if (wsHook) {
      wsHook.publish('/app/voice/' + currentChannel?.id + '/leave', {});
    }
    setCurrentChannel(null);
  };

  if (!currentServer) {
    return (
      <div style={{
        width: 240,
        background: 'var(--discord-sidebar)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--discord-text-muted)',
        fontSize: 14,
      }}>
        Chọn một server
      </div>
    );
  }

  return (
    <>
      <div style={{
        width: 240,
        background: 'var(--discord-sidebar)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Server header */}
        <div 
          onClick={() => setShowServerDropdown(!showServerDropdown)}
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--discord-bg-primary)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
            fontWeight: 700,
            fontSize: 16,
            color: 'var(--discord-text-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative'
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentServer.name}</span>
          <span style={{ fontSize: 18, color: 'var(--discord-text-muted)', transform: showServerDropdown ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>⚙️</span>
          
          {/* Server Dropdown menu */}
          {showServerDropdown && (
            <div 
              style={{
                position: 'absolute', top: 56, left: 8, right: 8, background: 'var(--discord-bg-primary)',
                borderRadius: 4, padding: 8, zIndex: 100, boxShadow: '0 8px 16px rgba(0,0,0,0.5)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div 
                onClick={() => { setShowInvite(true); setShowServerDropdown(false); }}
                style={{ padding: '8px', color: 'var(--discord-brand)', cursor: 'pointer', borderRadius: 2, display: 'flex', justifyContent: 'space-between' }}
                className="channel-item"
              >
                Mời mọi người <span>👋</span>
              </div>
              {isAdmin && (
                <div 
                  onClick={() => { setShowServerSettings(true); setShowServerDropdown(false); }}
                  style={{ padding: '8px', color: 'var(--discord-text-primary)', cursor: 'pointer', borderRadius: 2, display: 'flex', justifyContent: 'space-between' }}
                  className="channel-item"
                >
                  Cài đặt Máy chủ <span>⚙️</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Channel list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
          {/* TEXT channels */}
          <div style={{ marginBottom: 8 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 8px',
              color: 'var(--discord-text-muted)',
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}>
              <span>Văn bản</span>
              {isAdmin && (
                <span
                  onClick={() => setShowCreateChannel('TEXT')}
                  style={{ cursor: 'pointer', fontSize: 18, lineHeight: 1 }}
                  title="Thêm channel văn bản"
                >+</span>
              )}
            </div>
            {textChannels.map((ch) => (
              <ChannelItem
                key={ch.id}
                channel={ch}
                active={currentChannel?.id === ch.id}
                onSelect={() => setCurrentChannel(ch)}
                isAdmin={isAdmin}
                onSettings={() => setShowChannelSettings(ch)}
              />
            ))}
          </div>

          {/* VOICE channels */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 8px',
              color: 'var(--discord-text-muted)',
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}>
              <span>Thoại</span>
              {isAdmin && (
                <span
                  onClick={() => setShowCreateChannel('VOICE')}
                  style={{ cursor: 'pointer', fontSize: 18, lineHeight: 1 }}
                  title="Thêm voice channel"
                >+</span>
              )}
            </div>
            {voiceChannels.map((ch) => (
              <ChannelItem
                key={ch.id}
                channel={ch}
                active={currentChannel?.id === ch.id}
                onSelect={() => setCurrentChannel(ch)}
                isAdmin={isAdmin}
                onSettings={() => setShowChannelSettings(ch)}
              />
            ))}
          </div>
        </div>

        {/* Footer user info */}
        <div style={{
          padding: '10px 12px',
          background: 'var(--discord-user-area)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <img
            src={currentUser?.avatarUrl || 'https://via.placeholder.com/32'}
            alt={currentUser?.displayName}
            className="avatar"
            style={{ width: 32, height: 32 }}
          />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--discord-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentUser?.displayName}
            </div>
            <div style={{ fontSize: 12, color: 'var(--discord-text-muted)' }}>
              🟢 Online
            </div>
          </div>
          {/* Footer user info */}
          <div style={{ display: 'flex', gap: 4 }}>
            {currentChannelId && (
              <>
                <button
                  onClick={toggleMic}
                  style={{ background: 'transparent', border: 'none', color: isMicOn ? 'var(--discord-text-secondary)' : 'var(--discord-red)', cursor: 'pointer', fontSize: 16, padding: '4px', borderRadius: 4 }}
                  title={isMicOn ? 'Tắt Mic' : 'Bật Mic'}
                >
                  {isMicOn ? '🎤' : '🔇'}
                </button>
                <button
                  onClick={toggleCamera}
                  style={{ background: 'transparent', border: 'none', color: isCamOn ? 'var(--discord-text-secondary)' : 'var(--discord-red)', cursor: 'pointer', fontSize: 16, padding: '4px', borderRadius: 4 }}
                  title={isCamOn ? 'Tắt Camera' : 'Bật Camera'}
                >
                  {isCamOn ? '📷' : '🚫'}
                </button>
                <button
                  onClick={toggleScreenShare}
                  style={{ background: 'transparent', border: 'none', color: isScreenSharing ? 'var(--discord-green)' : 'var(--discord-text-secondary)', cursor: 'pointer', fontSize: 16, padding: '4px', borderRadius: 4 }}
                  title={isScreenSharing ? 'Dừng Share' : 'Share Màn Hình'}
                >
                  {isScreenSharing ? '💻' : '📺'}
                </button>
              </>
            )}
            <a
              href="/logout"
              style={{ color: 'var(--discord-text-secondary)', fontSize: 16, textDecoration: 'none', padding: '4px', marginLeft: 4 }}
              title="Đăng xuất"
            >⏏</a>
          </div>
        </div>
      </div>

      {showCreateChannel && (
        <CreateChannelModal
          type={showCreateChannel}
          onClose={() => setShowCreateChannel(false)}
        />
      )}
      {showServerSettings && <ServerSettingsModal onClose={() => setShowServerSettings(false)} />}
      {showChannelSettings && <ChannelSettingsModal channel={showChannelSettings} onClose={() => setShowChannelSettings(null)} />}
      {showInvite && <InviteModal server={currentServer} onClose={() => setShowInvite(false)} />}
    </>
  );
};

const ChannelItem = ({ channel, active, onSelect, isAdmin, onSettings }) => {
  const icon = channel.type === 'TEXT' ? '#' : '🔊';
  return (
    <div
      className={`channel-item ${active ? 'active' : ''}`}
      onClick={onSelect}
    >
      <span style={{ color: 'var(--discord-text-muted)' }}>{icon}</span>
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {channel.name}
      </span>
      {isAdmin && (
        <span
          onClick={(e) => { e.stopPropagation(); onSettings(); }}
          style={{ transition: 'opacity 0.2s', fontSize: 16, color: 'var(--discord-text-muted)' }}
          className="channel-delete-btn"
          title="Cài đặt kênh"
        >⚙️</span>
      )}
    </div>
  );
};

export default ChannelSidebar;
