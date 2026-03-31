import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import useWebSocket from '../hooks/useWebSocket';
import useWebRTC from '../hooks/useWebRTC';
import useUserStore from '../store/useUserStore';
import useServerStore from '../store/useServerStore';
import useToastStore from '../store/useToastStore';
import useUnreadStore from '../store/useUnreadStore';
import api from '../api/axiosConfig';
import { replaceMentionTokens } from '../utils/mentionUtils';

/**
 * AppPage: Màn hình chính sau khi đã đăng nhập
 * Khởi tạo WebSocket và WebRTC hooks ở level cao nhất để share xuống các component
 */
const AppPage = () => {
  const navigate = useNavigate();
  const { currentUser, setCurrentUser, isLoading, setLoading } = useUserStore();
  const currentServer = useServerStore((state) => state.currentServer);
  const addToast = useToastStore((state) => state.addToast);
  const setUnreadSnapshot = useUnreadStore((state) => state.setSnapshot);
  const mergeServerSummary = useUnreadStore((state) => state.mergeServerSummary);
  const setNotifications = useUnreadStore((state) => state.setNotifications);
  const upsertNotification = useUnreadStore((state) => state.upsertNotification);
  const wsHook = useWebSocket();
  const subscribe = wsHook.subscribe;

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
  }, [navigate, setCurrentUser, setLoading]);

  useEffect(() => {
    if (!currentUser) {
      return undefined;
    }

    let isActive = true;

    const hydrateRealtimeState = async () => {
      try {
        const [snapshotRes, notificationsRes] = await Promise.all([
          api.get('/channels/unread'),
          api.get('/notifications'),
        ]);

        if (!isActive) {
          return;
        }

        setUnreadSnapshot(snapshotRes.data);
        setNotifications(notificationsRes.data);
      } catch (error) {
        console.error('Khong the dong bo unread va notifications:', error);
      }
    };

    hydrateRealtimeState();

    return () => {
      isActive = false;
    };
  }, [currentUser, setNotifications, setUnreadSnapshot]);

  useEffect(() => {
    if (!currentUser || !currentServer?.id) {
      return undefined;
    }

    let isActive = true;

    const refreshServerUnread = async () => {
      try {
        const res = await api.get(`/servers/${currentServer.id}/unread`);
        if (isActive) {
          mergeServerSummary(res.data);
        }
      } catch (error) {
        console.error('Khong the tai unread summary cho server hien tai:', error);
      }
    };

    refreshServerUnread();

    return () => {
      isActive = false;
    };
  }, [currentServer?.id, currentUser, mergeServerSummary]);

  useEffect(() => {
    if (!currentUser) {
      return undefined;
    }

    const unsubscribeUnread = subscribe('/user/queue/unread', (snapshot) => {
      setUnreadSnapshot(snapshot);
    });
    const unsubscribeNotifications = subscribe('/user/queue/notifications', (notification) => {
      upsertNotification(notification);

      const preview = replaceMentionTokens(
        notification?.preview || '',
        (userId) => userId === currentUser.id ? 'ban' : 'thanh vien'
      );
      const message = preview
        ? `${notification.senderName} nhac ban: ${preview}`
        : `${notification.senderName} nhac ban trong mot tin nhan moi.`;

      addToast(message, 'mention');
    });

    return () => {
      unsubscribeUnread?.();
      unsubscribeNotifications?.();
    };
  }, [addToast, currentUser, setUnreadSnapshot, subscribe, upsertNotification]);

  if (isLoading) {
    return (
      <div className="status-screen">
        <div className="status-card animate-fade-in">
          <div className="status-card__icon">
            <span className="app-brand-mark app-brand-mark--small">
              <BrandIcon />
            </span>
          </div>
          <h1 className="status-card__title">Đang tải MiniDiscord</h1>
          <p className="status-card__text">Đang đồng bộ phiên đăng nhập và khởi tạo không gian làm việc...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="status-screen">
        <div className="status-card animate-fade-in">
          <div className="status-card__icon">
            <span className="app-brand-mark app-brand-mark--small">
              <BrandIcon />
            </span>
          </div>
          <h1 className="status-card__title">Phiên đăng nhập đã hết hạn</h1>
          <p className="status-card__text">Đang chuyển hướng về trang đăng nhập để làm mới phiên của bạn...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return null;

  return <MainLayout wsHook={wsHook} webRTCHook={webRTCHook} />;
};

const BrandIcon = () => (
  <svg viewBox="0 0 28 20" fill="currentColor" aria-hidden="true">
    <path d="M23.0212 1.67671C21.3107 0.879656 19.5079 0.318797 17.6584 0C17.4062 0.461742 17.1749 0.934541 16.9708 1.4184C15.003 1.12145 13.0135 1.12145 11.0854 1.4184C10.8813 0.923485 10.639 0.461742 10.3868 0C8.5262 0.318797 6.72336 0.880721 5.01287 1.67671C1.56727 6.77853 0.649666 11.7538 1.11108 16.652C3.10137 18.1415 5.3262 19.2743 7.69177 20C8.22338 19.2743 8.69519 18.4993 9.09812 17.6911C8.32996 17.3997 7.58522 17.0424 6.87684 16.6135C7.06531 16.4762 7.24726 16.3268 7.42341 16.1662C11.5911 18.1136 16.4862 18.1136 20.6219 16.1662C20.8039 16.3268 20.9859 16.4762 21.1687 16.6135C20.4603 17.0328 19.7156 17.3997 18.9474 17.6911C19.3503 18.4993 19.8221 19.2743 20.3537 20C22.7193 19.2743 24.9441 18.1415 26.9344 16.652C27.4988 10.9743 26.0436 6.09635 23.0212 1.67671ZM9.68009 13.6383C8.39754 13.6383 7.34085 12.4453 7.34085 10.994C7.34085 9.54272 8.37155 8.34973 9.68009 8.34973C10.9886 8.34973 12.0395 9.54272 12.0187 10.994C12.0187 12.4453 10.9886 13.6383 9.68009 13.6383ZM18.3161 13.6383C17.0336 13.6383 15.9769 12.4453 15.9769 10.994C15.9769 9.54272 17.0076 8.34973 18.3161 8.34973C19.6246 8.34973 20.6755 9.54272 20.6547 10.994C20.6547 12.4453 19.6246 13.6383 18.3161 13.6383Z" />
  </svg>
);

export default AppPage;
