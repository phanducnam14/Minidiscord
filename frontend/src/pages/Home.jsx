import React from 'react';

/**
 * Trang đăng nhập - hiển thị khi chưa có session
 */
const Home = () => {
  const handleLogin = () => {
    window.location.href = '/oauth2/authorization/google';
  };

  return (
    <div style={{
      height: '100vh',
      background: 'linear-gradient(135deg, #23272a 0%, #1e1f22 60%, #2b2d31 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 32,
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 96,
          height: 96,
          background: 'var(--discord-accent)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 48,
          margin: '0 auto 16px',
          boxShadow: '0 8px 32px rgba(88,101,242,0.5)',
        }}>
          🎮
        </div>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: 'white', marginBottom: 8 }}>
          MiniDiscord
        </h1>
        <p style={{ color: 'var(--discord-text-secondary)', fontSize: 16 }}>
          Chat & voice với bạn bè — ngay lập tức
        </p>
      </div>

      {/* Features */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 8 }}>
        {[
          { icon: '💬', label: 'Text chat' },
          { icon: '🔊', label: 'Voice call' },
          { icon: '📷', label: 'Video call' },
          { icon: '📁', label: 'File share' },
        ].map((f) => (
          <div key={f.label} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            color: 'var(--discord-text-secondary)', fontSize: 14,
          }}>
            <span style={{ fontSize: 28 }}>{f.icon}</span>
            {f.label}
          </div>
        ))}
      </div>

      {/* Login button */}
      <button
        onClick={handleLogin}
        style={{
          background: 'white',
          color: '#1a1a1a',
          border: 'none',
          borderRadius: 8,
          padding: '14px 32px',
          fontSize: 16,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          transition: 'transform 0.1s, box-shadow 0.1s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = '';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
        }}
      >
        <svg viewBox="0 0 24 24" width="22" height="22">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Đăng nhập với Google
      </button>

      <p style={{ color: 'var(--discord-text-muted)', fontSize: 13 }}>
        Bảo mật bởi Google OAuth2
      </p>
    </div>
  );
};

export default Home;
