import React, { useEffect, useState } from 'react';
import api from '../../api/axiosConfig';
import useServerStore from '../../store/useServerStore';
import useUserStore from '../../store/useUserStore';
import VideoGrid from './VideoGrid';

/**
 * VoiceChannel: hiển thị participants, nút join/leave, video grid khi đã join
 */
const VoiceChannel = ({ webRTCHook }) => {
  const { currentChannel } = useServerStore();
  const { currentUser } = useUserStore();
  const [participants, setParticipants] = useState([]);

  const { joinVoiceChannel, leaveVoiceChannel, peers, localStream, currentChannelId } = webRTCHook;

  const isInChannel = currentChannelId === currentChannel?.id;
  const channelId = currentChannel?.id;

  useEffect(() => {
    if (!channelId) return;
    const load = async () => {
      try {
        const res = await api.get(`/channels/${channelId}/participants`);
        setParticipants(res.data || []);
      } catch (e) {
        console.error('Lỗi load participants:', e);
      }
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [channelId]);

  const handleJoin = async () => {
    await joinVoiceChannel(channelId);
  };

  const handleLeave = () => {
    leaveVoiceChannel();
  };

  if (!currentChannel) return null;

  return (
    <div className="voice-shell">
      <div className="chat-header">
        <span className="chat-header__icon">
          <VolumeIcon />
        </span>
        <div className="chat-header__meta">
          <span className="chat-header__title">{currentChannel.name}</span>
          <span className="chat-header__subtitle">Kênh thoại</span>
        </div>
        <div className="chat-header__spacer">
          {!isInChannel ? (
            <button onClick={handleJoin} className="btn-primary btn-compact">
              Tham gia
            </button>
          ) : (
            <button onClick={handleLeave} className="btn-danger btn-compact">
              Rời kênh
            </button>
          )}
        </div>
      </div>

      {!isInChannel ? (
        <div className="voice-empty-state">
          <div className="voice-empty-state__card animate-fade-in">
            <span className="voice-empty-state__icon">
              <VolumeIcon />
            </span>
            <h3>{currentChannel.name}</h3>
            <p className="voice-empty-state__text">Bấm “Tham gia” để vào voice channel và bắt đầu trò chuyện.</p>
            {participants.length > 0 && (
              <div className="voice-occupancy-badge">
                <UsersIcon />
                <span>{participants.length} người đang trong kênh</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <VideoGrid
          localStream={localStream}
          peers={peers}
          currentUser={currentUser}
          webRTCHook={webRTCHook}
          onLeave={handleLeave}
        />
      )}
    </div>
  );
};

const VolumeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M11 5 6 9H3v6h3l5 4V5Z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7" />
    <path d="M18.5 5.5a9 9 0 0 1 0 13" />
  </svg>
);

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export default VoiceChannel;
