import React from 'react';

/**
 * Trang đăng nhập - hiển thị khi chưa có session
 */
const Home = () => {
  const features = [
    {
      title: 'Nhắn tin theo kênh',
      description: 'Giữ hội thoại gọn gàng, dễ theo dõi theo từng chủ đề.',
      icon: <ChatIcon />,
    },
    {
      title: 'Thoại tức thì',
      description: 'Vào voice channel nhanh, phù hợp nhóm nhỏ và trao đổi liên tục.',
      icon: <VoiceIcon />,
    },
    {
      title: 'Video rõ ràng',
      description: 'Bố cục video tập trung hơn để gọi nhóm trông bớt thô hơn.',
      icon: <VideoIcon />,
    },
    {
      title: 'Chia sẻ file nhanh',
      description: 'Gửi ảnh, tài liệu và tệp đính kèm ngay trong khung chat.',
      icon: <FileIcon />,
    },
  ];

  const handleLogin = () => {
    window.location.href = '/oauth2/authorization/google';
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade-in">
        <section className="auth-showcase">
          <div className="auth-brand-block">
            <span className="auth-eyebrow">Không gian chat gọn gàng cho nhóm nhỏ</span>
            <div className="app-brand-mark">
              <BrandIcon />
            </div>
            <div>
              <h1 className="auth-title">MiniDiscord</h1>
              <p className="auth-subtitle">
                Trò chuyện, gọi thoại và chia sẻ file trong một giao diện tối giản hơn,
                rõ thứ bậc hơn và vẫn giữ nguyên luồng đăng nhập hiện tại.
              </p>
            </div>
          </div>

          <div className="auth-feature-grid">
            {features.map((feature) => (
              <div key={feature.title} className="auth-feature-card">
                <span className="auth-feature-card__icon">{feature.icon}</span>
                <div>
                  <div className="auth-feature-card__title">{feature.title}</div>
                  <p className="auth-feature-card__text">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="auth-login-panel">
          <span className="auth-login-panel__eyebrow">Đăng nhập an toàn</span>
          <h2 className="auth-login-panel__title">Vào ngay không gian của bạn</h2>
          <p className="auth-login-panel__text">
            Dùng tài khoản Google để tiếp tục. Sau khi xác thực, bạn sẽ được đưa thẳng
            vào ứng dụng như luồng hiện tại.
          </p>

          <button type="button" onClick={handleLogin} className="auth-login-button">
            <GoogleIcon />
            <span>Đăng nhập với Google</span>
          </button>

          <div className="auth-login-meta">
            <ShieldIcon />
            <span>Bảo mật bởi Google OAuth2</span>
          </div>

          <div className="auth-trust-list">
            <div className="auth-trust-item">
              <CheckIcon />
              <span>Giữ nguyên route, auth flow và hành vi đăng nhập hiện có.</span>
            </div>
            <div className="auth-trust-item">
              <CheckIcon />
              <span>Phù hợp cho chat, voice và video trong cùng một workspace.</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

const BrandIcon = () => (
  <svg viewBox="0 0 28 20" fill="currentColor" aria-hidden="true">
    <path d="M23.0212 1.67671C21.3107 0.879656 19.5079 0.318797 17.6584 0C17.4062 0.461742 17.1749 0.934541 16.9708 1.4184C15.003 1.12145 13.0135 1.12145 11.0854 1.4184C10.8813 0.923485 10.639 0.461742 10.3868 0C8.5262 0.318797 6.72336 0.880721 5.01287 1.67671C1.56727 6.77853 0.649666 11.7538 1.11108 16.652C3.10137 18.1415 5.3262 19.2743 7.69177 20C8.22338 19.2743 8.69519 18.4993 9.09812 17.6911C8.32996 17.3997 7.58522 17.0424 6.87684 16.6135C7.06531 16.4762 7.24726 16.3268 7.42341 16.1662C11.5911 18.1136 16.4862 18.1136 20.6219 16.1662C20.8039 16.3268 20.9859 16.4762 21.1687 16.6135C20.4603 17.0328 19.7156 17.3997 18.9474 17.6911C19.3503 18.4993 19.8221 19.2743 20.3537 20C22.7193 19.2743 24.9441 18.1415 26.9344 16.652C27.4988 10.9743 26.0436 6.09635 23.0212 1.67671ZM9.68009 13.6383C8.39754 13.6383 7.34085 12.4453 7.34085 10.994C7.34085 9.54272 8.37155 8.34973 9.68009 8.34973C10.9886 8.34973 12.0395 9.54272 12.0187 10.994C12.0187 12.4453 10.9886 13.6383 9.68009 13.6383ZM18.3161 13.6383C17.0336 13.6383 15.9769 12.4453 15.9769 10.994C15.9769 9.54272 17.0076 8.34973 18.3161 8.34973C19.6246 8.34973 20.6755 9.54272 20.6547 10.994C20.6547 12.4453 19.6246 13.6383 18.3161 13.6383Z" />
  </svg>
);

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const ChatIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 10h10" />
    <path d="M7 14h6" />
    <path d="M5 19l-2 2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5Z" />
  </svg>
);

const VoiceIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 1 1-6 0V6a3 3 0 0 1 3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <path d="M12 19v3" />
  </svg>
);

const VideoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="13" height="14" rx="3" />
    <path d="m16 10 5-3v10l-5-3" />
  </svg>
);

const FileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
    <path d="M14 3v5h5" />
    <path d="M9 15h6" />
    <path d="M9 11h3" />
  </svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3 5 6v6c0 5 3.5 8 7 9 3.5-1 7-4 7-9V6l-7-3Z" />
    <path d="m9.5 12.5 1.8 1.8 3.6-4.1" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m5 13 4 4L19 7" />
  </svg>
);

export default Home;
