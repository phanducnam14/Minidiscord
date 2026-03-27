import React, { useMemo, useState } from 'react';
import useServerStore from '../../store/useServerStore';
import useUserStore from '../../store/useUserStore';
import useUnreadStore from '../../store/useUnreadStore';
import CreateChannelModal from '../modals/CreateChannelModal';
import ServerSettingsModal from '../modals/ServerSettingsModal';
import ChannelSettingsModal from '../modals/ChannelSettingsModal';
import InviteModal from '../modals/InviteModal';
import ProfileModal from '../modals/ProfileModal';
import { SERVER_PERMISSIONS, hasServerPermission } from '../../utils/serverPermissions';

const ChannelSidebar = ({ wsHook, webRTCHook }) => {
  const { currentServer, channels, currentChannel, setCurrentChannel } = useServerStore();
  const { currentUser } = useUserStore();
  const unreadChannels = useUnreadStore((state) => state.snapshot.channels);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showServerDropdown, setShowServerDropdown] = useState(false);
  const [showServerSettings, setShowServerSettings] = useState(false);
  const [showChannelSettings, setShowChannelSettings] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);

  const { isMicOn, isCamOn, isScreenSharing, toggleMic, toggleCamera, toggleScreenShare, currentChannelId } = webRTCHook || {};

  const textChannels = channels.filter((c) => c.type === 'TEXT');
  const voiceChannels = channels.filter((c) => c.type === 'VOICE');
  const connectedVoiceChannel = channels.find((channel) => channel.id === currentChannelId);
  const unreadByChannelId = useMemo(
    () => new Map(unreadChannels.map((summary) => [summary.channelId, summary])),
    [unreadChannels]
  );

  const canCreateInvite = hasServerPermission(currentServer, SERVER_PERMISSIONS.MEMBER_MANAGE);
  const canCreateChannel = hasServerPermission(currentServer, SERVER_PERMISSIONS.CHANNEL_CREATE);
  const canManageChannels = hasServerPermission(currentServer, SERVER_PERMISSIONS.CHANNEL_UPDATE)
    || hasServerPermission(currentServer, SERVER_PERMISSIONS.CHANNEL_DELETE);

  const handleLeaveVoice = () => {
    if (webRTCHook?.leaveVoiceChannel) {
      webRTCHook.leaveVoiceChannel();
    } else if (wsHook) {
      wsHook.publish('/app/voice/' + currentChannel?.id + '/leave', {});
    }
  };

  if (!currentServer) {
    return (
      <aside className="sidebar-shell sidebar-shell--empty">
        <div className="sidebar-empty-state animate-fade-in">
          <span className="sidebar-empty-state__icon">
            <ServerIcon />
          </span>
          <span>Chọn một server để xem channel và thành viên.</span>
        </div>
      </aside>
    );
  }

  return (
    <>
      <aside className="sidebar-shell">
        <div onClick={() => setShowServerDropdown(!showServerDropdown)} className="sidebar-header">
          <div className="sidebar-header__content">
            <span className="sidebar-header__badge">{getInitial(currentServer.name)}</span>
            <span className="sidebar-header__title">{currentServer.name}</span>
          </div>
          <span className={`sidebar-header__toggle ${showServerDropdown ? 'is-open' : ''}`}>
            <ChevronIcon />
          </span>

          {showServerDropdown && (
            <div className="sidebar-dropdown" onClick={(e) => e.stopPropagation()}>
              {canCreateInvite && (
                <button
                  type="button"
                  onClick={() => { setShowInvite(true); setShowServerDropdown(false); }}
                  className="sidebar-dropdown__item sidebar-dropdown__item--accent"
                >
                  <span>Mời mọi người</span>
                  <InviteIcon />
                </button>
              )}
              <button
                type="button"
                onClick={() => { setShowServerSettings(true); setShowServerDropdown(false); }}
                className="sidebar-dropdown__item"
              >
                <span>Cài đặt máy chủ</span>
                <SettingsIcon />
              </button>
            </div>
          )}
        </div>

        <div className="sidebar-scroll">
          <section className="sidebar-section">
            <div className="sidebar-section__header">
              <span className="sidebar-section__title">Văn bản</span>
              {canCreateChannel && (
                <button
                  type="button"
                  onClick={() => setShowCreateChannel('TEXT')}
                  className="sidebar-section__action"
                  title="Thêm channel văn bản"
                >
                  <PlusIcon />
                </button>
              )}
            </div>
            {textChannels.map((ch) => {
              const unreadSummary = unreadByChannelId.get(ch.id);

              return (
                <ChannelItem
                  key={ch.id}
                  channel={ch}
                  active={currentChannel?.id === ch.id}
                  onSelect={() => setCurrentChannel(ch)}
                  canManageChannel={canManageChannels}
                  onSettings={() => setShowChannelSettings(ch)}
                  unreadCount={unreadSummary?.unreadCount || 0}
                  mentionCount={unreadSummary?.mentionCount || 0}
                />
              );
            })}
          </section>

          <section className="sidebar-section">
            <div className="sidebar-section__header">
              <span className="sidebar-section__title">Thoại</span>
              {canCreateChannel && (
                <button
                  type="button"
                  onClick={() => setShowCreateChannel('VOICE')}
                  className="sidebar-section__action"
                  title="Thêm voice channel"
                >
                  <PlusIcon />
                </button>
              )}
            </div>
            {voiceChannels.map((ch) => (
              <ChannelItem
                key={ch.id}
                channel={ch}
                active={currentChannel?.id === ch.id}
                onSelect={() => setCurrentChannel(ch)}
                canManageChannel={canManageChannels}
                onSettings={() => setShowChannelSettings(ch)}
              />
            ))}
          </section>
        </div>

        {currentChannelId && (
          <div className="voice-connection-card">
            <div className="voice-connection-card__header">
              <div>
                <span className="voice-connection-card__status">
                  <span className="voice-connection-card__status-dot" />
                  Thoại đã kết nối
                </span>
                <span className="voice-connection-card__channel">
                  {connectedVoiceChannel?.name || 'Kênh thoại'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleLeaveVoice}
                className="footer-icon-btn"
                title="Ngắt kết nối"
              >
                <PhoneOffIcon />
              </button>
            </div>

            <div className="voice-control-grid">
              <button
                type="button"
                onClick={toggleMic}
                className={`voice-control-btn ${isMicOn ? 'is-active' : 'is-off'}`}
                title={isMicOn ? 'Tắt Mic' : 'Bật Mic'}
              >
                <span className="voice-control-btn__icon">{isMicOn ? <MicIcon /> : <MicOffIcon />}</span>
                <span>Mic</span>
              </button>
              <button
                type="button"
                onClick={toggleCamera}
                className={`voice-control-btn ${isCamOn ? 'is-active' : 'is-off'}`}
                title={isCamOn ? 'Tắt Camera' : 'Bật Camera'}
              >
                <span className="voice-control-btn__icon">{isCamOn ? <CameraIcon /> : <CameraOffIcon />}</span>
                <span>Cam</span>
              </button>
              <button
                type="button"
                onClick={toggleScreenShare}
                className={`voice-control-btn ${isScreenSharing ? 'is-active' : ''}`}
                title={isScreenSharing ? 'Dừng Share' : 'Share Màn Hình'}
              >
                <span className="voice-control-btn__icon"><ScreenIcon /></span>
                <span>Share</span>
              </button>
            </div>
          </div>
        )}

        <div className="user-panel">
          <div className="user-panel__avatar-wrap">
            <img
              src={currentUser?.avatarUrl || 'https://via.placeholder.com/32'}
              alt={currentUser?.displayName}
              className="avatar user-panel__avatar"
            />
            <div className="user-panel__presence" />
          </div>

          <div className="user-panel__meta">
            <div className="user-panel__name">{currentUser?.displayName}</div>
            <div className="user-panel__status">Online</div>
          </div>

          <div className="user-panel__actions">
            <button
              type="button"
              onClick={() => setShowProfileSettings(true)}
              title="Cài đặt"
              className="footer-icon-btn"
            >
              <SettingsIcon />
            </button>
            <a href="/logout" title="Đăng xuất" className="footer-icon-btn">
              <LogoutIcon />
            </a>
          </div>
        </div>
      </aside>

      {showCreateChannel && (
        <CreateChannelModal
          type={showCreateChannel}
          onClose={() => setShowCreateChannel(false)}
        />
      )}
      {showServerSettings && <ServerSettingsModal onClose={() => setShowServerSettings(false)} />}
      {showChannelSettings && <ChannelSettingsModal channel={showChannelSettings} onClose={() => setShowChannelSettings(null)} />}
      {showInvite && <InviteModal server={currentServer} onClose={() => setShowInvite(false)} />}
      {showProfileSettings && <ProfileModal onClose={() => setShowProfileSettings(false)} />}
    </>
  );
};

const ChannelItem = ({ channel, active, onSelect, canManageChannel, onSettings, unreadCount = 0, mentionCount = 0 }) => {
  const icon = channel.type === 'TEXT' ? <HashIcon /> : <VolumeIcon />;
  return (
    <div className={`channel-item ${active ? 'active' : ''}`} onClick={onSelect}>
      <span className="channel-item__icon">{icon}</span>
      <span className="channel-item__label">{channel.name}</span>
      {(channel.type === 'TEXT') && (
        <span className="channel-item__badges">
          {Boolean(mentionCount) && (
            <span className="nav-badge nav-badge--mention">@{mentionCount}</span>
          )}
          {Boolean(unreadCount) && (
            <span className="nav-badge nav-badge--unread">{unreadCount}</span>
          )}
        </span>
      )}
      {canManageChannel && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onSettings(); }}
          className="channel-delete-btn"
          title="Cài đặt kênh"
        >
          <SettingsIcon />
        </button>
      )}
    </div>
  );
};

const getInitial = (name = '') => name.trim().charAt(0).toUpperCase() || 'S';

const ServerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 8.5 12 4l8 4.5" />
    <path d="M4 8.5V16l8 4 8-4V8.5" />
    <path d="M12 12v8" />
  </svg>
);

const ChevronIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const InviteIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
    <circle cx="9.5" cy="7" r="4" />
    <path d="M19 8v6" />
    <path d="M16 11h6" />
  </svg>
);

const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.82-.33 1.7 1.7 0 0 0-1 1.54V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.54 1.7 1.7 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.54-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.54-1 1.7 1.7 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 8.95 4.6 1.7 1.7 0 0 0 10 3.06V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.54 1.7 1.7 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 8.95 1.7 1.7 0 0 0 20.94 10H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.54 1Z" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);

const HashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 9h14" />
    <path d="M5 15h14" />
    <path d="M10 4 8 20" />
    <path d="m16 4-2 16" />
  </svg>
);

const VolumeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M11 5 6 9H3v6h3l5 4V5Z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7" />
    <path d="M18.5 5.5a9 9 0 0 1 0 13" />
  </svg>
);

const MicIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 1 1-6 0V6a3 3 0 0 1 3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <path d="M12 19v3" />
  </svg>
);

const MicOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m4 4 16 16" />
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
    <path d="M15 9V6a3 3 0 0 0-5.68-1.33" />
    <path d="M19 10v2a7 7 0 0 1-12 4.95" />
    <path d="M12 19v3" />
  </svg>
);

const CameraIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="6" width="13" height="12" rx="3" />
    <path d="m16 10 5-3v10l-5-3" />
  </svg>
);

const CameraOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m2 2 20 20" />
    <path d="M10.5 6H6a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h9" />
    <path d="m16 10 5-3v10l-5-3" />
  </svg>
);

const ScreenIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="12" rx="2" />
    <path d="M8 20h8" />
    <path d="M12 16v4" />
  </svg>
);

const PhoneOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m3 3 18 18" />
    <path d="M15 9a12.8 12.8 0 0 1 6 2l-3 3a2 2 0 0 1-2.1.46l-1.76-.59" />
    <path d="M9.88 5.1 8 4.47A2 2 0 0 0 5.9 4.93L3 8a12.79 12.79 0 0 1 4.74 8.74l3.08-2.91a2 2 0 0 0 .55-2.04l-.6-1.9" />
  </svg>
);

const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
);

export default ChannelSidebar;
