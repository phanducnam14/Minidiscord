import React, { useEffect, useRef } from 'react';

/**
 * VideoGrid: hiển thị video local + remote peers
 * Layout tự động căn theo số người
 */
const VideoGrid = ({ localStream, peers, currentUser, webRTCHook, onLeave }) => {
  const localVideoRef = useRef(null);
  const { isMicOn, isCamOn, isScreenSharing, toggleMic, toggleCamera, toggleScreenShare } = webRTCHook || {};
  const localName = currentUser?.displayName || 'Bạn';

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const peerEntries = peers ? [...peers.entries()] : [];
  const peerCount = peerEntries.length + 1;
  const localHasVideo = Boolean(localStream?.getVideoTracks?.().length) && isCamOn;

  const gridClass = peerCount <= 1 ? 'grid-1'
    : peerCount === 2 ? 'grid-2'
    : peerCount <= 4 ? 'grid-4'
    : 'grid-6';

  return (
    <div className="video-stage">
      <div className={`video-grid ${gridClass}`}>
        <div className="video-tile">
          <video ref={localVideoRef} autoPlay muted playsInline className={localHasVideo ? '' : 'is-hidden'} />
          {!localHasVideo && (
            <VideoPlaceholder name={localName} message="Camera của bạn đang tắt" />
          )}
          <div className="video-name-tag">
            <span>{localName} (Bạn)</span>
            {!isMicOn && <span className="video-name-tag__status">Mic tắt</span>}
          </div>
        </div>

        {peerEntries.map(([userId, peerData]) => (
          <RemoteVideo key={userId} userId={userId} peerData={peerData} />
        ))}
      </div>

      <div className="video-controls-bar">
        <div className="video-controls-bar__meta">
          <UsersIcon />
          <span>{peerCount} người đang tham gia</span>
        </div>

        <div className="video-controls-bar__actions">
          <ControlBtn
            icon={isMicOn ? <MicIcon /> : <MicOffIcon />}
            label="Mic"
            onClick={toggleMic}
            stateClass={isMicOn ? 'is-active' : 'is-off'}
            title={isMicOn ? 'Tắt mic' : 'Bật mic'}
          />
          <ControlBtn
            icon={isCamOn ? <CameraIcon /> : <CameraOffIcon />}
            label="Camera"
            onClick={toggleCamera}
            stateClass={isCamOn ? 'is-active' : 'is-off'}
            title={isCamOn ? 'Tắt camera' : 'Bật camera'}
          />
          <ControlBtn
            icon={<ScreenIcon />}
            label="Màn hình"
            onClick={toggleScreenShare}
            stateClass={isScreenSharing ? 'is-active' : ''}
            title={isScreenSharing ? 'Dừng share màn hình' : 'Share màn hình'}
          />
          <ControlBtn
            icon={<PhoneOffIcon />}
            label="Rời kênh"
            onClick={onLeave}
            stateClass="is-danger"
            title="Rời kênh"
          />
        </div>
      </div>
    </div>
  );
};

const RemoteVideo = ({ userId, peerData }) => {
  const videoRef = useRef(null);
  const hasVideo = Boolean(peerData?.stream?.getVideoTracks?.().length);

  useEffect(() => {
    if (videoRef.current && peerData?.stream) {
      videoRef.current.srcObject = peerData.stream;
    }
  }, [peerData?.stream]);

  return (
    <div className="video-tile">
      <video ref={videoRef} autoPlay playsInline className={hasVideo ? '' : 'is-hidden'} />
      {!hasVideo && (
        <VideoPlaceholder name={peerData?.name || userId} message="Đang chờ video" />
      )}
      <div className="video-name-tag">
        <span>{peerData?.name || userId}</span>
      </div>
    </div>
  );
};

const VideoPlaceholder = ({ name, message }) => (
  <div className="video-tile__placeholder">
    <span className="video-tile__avatar">{getInitials(name)}</span>
    <div>
      <div className="video-tile__title">{name}</div>
      <div>{message}</div>
    </div>
  </div>
);

const ControlBtn = ({ icon, label, onClick, stateClass, title }) => (
  <button onClick={onClick} type="button" title={title || label} className={`video-control-btn ${stateClass || ''}`}>
    <span className="video-control-btn__icon">{icon}</span>
    <span>{label}</span>
  </button>
);

const getInitials = (name = '') => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]).join('').toUpperCase() || 'U';
};

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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

export default VideoGrid;
