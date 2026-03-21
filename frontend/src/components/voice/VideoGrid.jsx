import React, { useEffect, useRef, useState } from 'react';

/**
 * VideoGrid: hiển thị video local + remote peers
 * Layout tự động căn theo số người
 */
const VideoGrid = ({ localStream, peers, currentUser, webRTCHook, onLeave }) => {
  const localVideoRef = useRef(null);
  const { isMicOn, isCamOn, isScreenSharing, toggleMic, toggleCamera, toggleScreenShare } = webRTCHook || {};

  // Gắn localStream vào video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const peerCount = peers.size + 1; // +1 cho local

  // Xác định class grid CSS
  const gridClass = peerCount <= 1 ? 'grid-1'
    : peerCount === 2 ? 'grid-2'
    : peerCount <= 4 ? 'grid-4'
    : 'grid-6';



  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Video grid */}
      <div className={`video-grid ${gridClass}`} style={{ flex: 1 }}>
        {/* Local video */}
        <div className="video-tile">
          <video ref={localVideoRef} autoPlay muted playsInline />
          <div className="video-name-tag">
            {currentUser?.displayName} (Bạn)
            {!isMicOn && ' 🔇'}
          </div>
        </div>

        {/* Remote peers */}
        {[...peers.entries()].map(([userId, peerData]) => (
          <RemoteVideo key={userId} userId={userId} peerData={peerData} />
        ))}
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        padding: '16px',
        background: 'rgba(0,0,0,0.3)',
        flexShrink: 0,
      }}>
        <ControlBtn
          icon={isMicOn ? '🎤' : '🔇'}
          label={isMicOn ? 'Tắt mic' : 'Bật mic'}
          onClick={toggleMic}
          active={isMicOn}
        />
        <ControlBtn
          icon={isCamOn ? '📷' : '🚫'}
          label={isCamOn ? 'Tắt cam' : 'Bật cam'}
          onClick={toggleCamera}
          active={isCamOn}
        />
        <ControlBtn
          icon={isScreenSharing ? '💻' : '📺'}
          label={isScreenSharing ? 'Dừng share' : 'Share màn hình'}
          onClick={toggleScreenShare}
          active={isScreenSharing}
        />
        <button
          onClick={onLeave}
          style={{
            background: 'var(--discord-red)',
            border: 'none',
            borderRadius: '50%',
            width: 52,
            height: 52,
            fontSize: 22,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.1s, opacity 0.1s',
          }}
          title="Rời kênh"
          onMouseEnter={(e) => e.target.style.opacity = '0.8'}
          onMouseLeave={(e) => e.target.style.opacity = '1'}
        >📞</button>
      </div>
    </div>
  );
};

const RemoteVideo = ({ userId, peerData }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && peerData?.stream) {
      videoRef.current.srcObject = peerData.stream;
    }
  }, [peerData?.stream]);

  return (
    <div className="video-tile">
      <video ref={videoRef} autoPlay playsInline />
      <div className="video-name-tag">
        {peerData?.name || userId}
      </div>
    </div>
  );
};

const ControlBtn = ({ icon, label, onClick, active }) => (
  <button
    onClick={onClick}
    title={label}
    style={{
      background: active ? 'rgba(255,255,255,0.15)' : 'var(--discord-red)',
      border: 'none',
      borderRadius: '50%',
      width: 48,
      height: 48,
      fontSize: 20,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background 0.1s',
      color: 'white',
    }}
  >
    {icon}
  </button>
);

export default VideoGrid;
