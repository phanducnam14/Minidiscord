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
  const [isJoined, setIsJoined] = useState(false);

  const { joinVoiceChannel, leaveVoiceChannel, peers, localStream, currentChannelId } = webRTCHook;

  const isInChannel = currentChannelId === currentChannel?.id;

  // Load danh sách participants hiện tại
  useEffect(() => {
    if (!currentChannel) return;
    const load = async () => {
      try {
        const res = await api.get(`/channels/${currentChannel.id}/participants`);
        setParticipants(res.data || []);
      } catch (e) {
        console.error('Lỗi load participants:', e);
      }
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [currentChannel?.id]);

  const handleJoin = async () => {
    await joinVoiceChannel(currentChannel.id);
    setIsJoined(true);
  };

  const handleLeave = () => {
    leaveVoiceChannel();
    setIsJoined(false);
  };

  if (!currentChannel) return null;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--discord-divider)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{ fontSize: 20 }}>🔊</span>
        <span style={{ fontWeight: 600, fontSize: 16 }}>{currentChannel.name}</span>
        {!isInChannel ? (
          <button
            onClick={handleJoin}
            className="btn-primary"
            style={{ marginLeft: 'auto', padding: '6px 16px' }}
          >
            Tham gia
          </button>
        ) : (
          <button
            onClick={handleLeave}
            className="btn-danger"
            style={{ marginLeft: 'auto', padding: '6px 16px' }}
          >
            Rời kênh
          </button>
        )}
      </div>

      {/* Nội dung */}
      {!isInChannel ? (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          color: 'var(--discord-text-muted)',
        }}>
          <span style={{ fontSize: 64 }}>🔊</span>
          <h3 style={{ color: 'var(--discord-text-primary)' }}>{currentChannel.name}</h3>
          <p>Bấm "Tham gia" để vào voice channel</p>
          {participants.length > 0 && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ marginBottom: 8 }}>{participants.length} người đang trong kênh</p>
            </div>
          )}
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

export default VoiceChannel;
