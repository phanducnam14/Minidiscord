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
    <div className="app-shell">
      <div className="toast-stack">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`toast-card ${toast.type === 'info' ? 'toast-card--info' : ''}`}
          >
            <span className="toast-card__icon">
              {toast.type === 'info' ? <InfoIcon /> : <BellIcon />}
            </span>
            <span className="toast-card__message">{toast.message}</span>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="toast-card__close"
              aria-label="Đóng thông báo"
            >
              <CloseIcon />
            </button>
          </div>
        ))}
      </div>

      <ServerList />
      <ChannelSidebar wsHook={wsHook} webRTCHook={webRTCHook} />

      <div className="app-main-surface">
        {currentChannel ? (
          isVoice ? (
            <VoiceChannel webRTCHook={webRTCHook} />
          ) : (
            <ChatArea wsHook={wsHook} />
          )
        ) : (
          <div className="shell-empty-state">
            <div className="shell-empty-state__card animate-fade-in">
              <span className="app-brand-mark">
                <BrandIcon />
              </span>
              <h2 className="shell-empty-state__title">Chào mừng đến MiniDiscord</h2>
              <p className="shell-empty-state__text">
                Chọn một channel để bắt đầu trò chuyện, gọi thoại hoặc cộng tác cùng mọi người.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const BrandIcon = () => (
  <svg viewBox="0 0 28 20" fill="currentColor" aria-hidden="true">
    <path d="M23.0212 1.67671C21.3107 0.879656 19.5079 0.318797 17.6584 0C17.4062 0.461742 17.1749 0.934541 16.9708 1.4184C15.003 1.12145 13.0135 1.12145 11.0854 1.4184C10.8813 0.923485 10.639 0.461742 10.3868 0C8.5262 0.318797 6.72336 0.880721 5.01287 1.67671C1.56727 6.77853 0.649666 11.7538 1.11108 16.652C3.10137 18.1415 5.3262 19.2743 7.69177 20C8.22338 19.2743 8.69519 18.4993 9.09812 17.6911C8.32996 17.3997 7.58522 17.0424 6.87684 16.6135C7.06531 16.4762 7.24726 16.3268 7.42341 16.1662C11.5911 18.1136 16.4862 18.1136 20.6219 16.1662C20.8039 16.3268 20.9859 16.4762 21.1687 16.6135C20.4603 17.0328 19.7156 17.3997 18.9474 17.6911C19.3503 18.4993 19.8221 19.2743 20.3537 20C22.7193 19.2743 24.9441 18.1415 26.9344 16.652C27.4988 10.9743 26.0436 6.09635 23.0212 1.67671ZM9.68009 13.6383C8.39754 13.6383 7.34085 12.4453 7.34085 10.994C7.34085 9.54272 8.37155 8.34973 9.68009 8.34973C10.9886 8.34973 12.0395 9.54272 12.0187 10.994C12.0187 12.4453 10.9886 13.6383 9.68009 13.6383ZM18.3161 13.6383C17.0336 13.6383 15.9769 12.4453 15.9769 10.994C15.9769 9.54272 17.0076 8.34973 18.3161 8.34973C19.6246 8.34973 20.6755 9.54272 20.6547 10.994C20.6547 12.4453 19.6246 13.6383 18.3161 13.6383Z" />
  </svg>
);

const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
    <path d="M9 17a3 3 0 0 0 6 0" />
  </svg>
);

const InfoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 10v5" />
    <path d="M12 7h.01" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="m6 6 12 12" />
    <path d="M18 6 6 18" />
  </svg>
);

export default MainLayout;
