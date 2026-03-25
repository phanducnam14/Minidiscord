import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import useWebSocket from '../hooks/useWebSocket';
import useWebRTC from '../hooks/useWebRTC';
import useUserStore from '../store/useUserStore';
import api from '../api/axiosConfig';

/**
 * AppPage: Màn hình chính sau khi đã đăng nhập
 * Khởi tạo WebSocket và WebRTC hooks ở level cao nhất để share xuống các component
 */
const AppPage = () => {
  const navigate = useNavigate();
  const { currentUser, setCurrentUser, isLoading, setLoading } = useUserStore();
  const wsHook = useWebSocket();

  const webRTCHook = useWebRTC({
    publish: wsHook.publish,
    subscribe: wsHook.subscribe,
    currentUser,
  });

  const [authError, setAuthError] = useState(false);

  // Load user hiện tại từ session
  useEffect(() => {
    const fetchMe = async () => {
      setLoading(true);
      try {
        const res = await api.get('/auth/me');
        if (res.data) {
          setCurrentUser(res.data);
          // Kiểm tra xem có public route URL nào được lưu trước khi đăng nhập không (VD: trang /invite)
          const returnUrl = sessionStorage.getItem('returnUrl');
          if (returnUrl) {
            sessionStorage.removeItem('returnUrl');
            navigate(returnUrl, { state: { autoJoin: true } });
          }
        }
      } catch (err) {
        console.error('Chưa đăng nhập:', err);
        setAuthError(true);
        // Redirect về login
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, []);

  if (isLoading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 16,
        color: 'var(--discord-text-secondary)',
      }}>
        <div style={{ fontSize: 48 }}>🎮</div>
        <p>Đang tải...</p>
      </div>
    );
  }

  if (authError) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--discord-text-secondary)',
      }}>
        <p>Phiên đăng nhập hết hạn. Đang chuyển hướng...</p>
      </div>
    );
  }

  if (!currentUser) return null;

  return <MainLayout wsHook={wsHook} webRTCHook={webRTCHook} />;
};

export default AppPage;
