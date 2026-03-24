import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import useUserStore from '../store/useUserStore';
import useServerStore from '../store/useServerStore';

const InvitePage = () => {
  const { serverId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useUserStore();
  const { addServer, setCurrentServer } = useServerStore();
  const [serverInfo, setServerInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchServerInfo = async () => {
      try {
        const res = await api.get(`/servers/${serverId}`);
        setServerInfo(res.data);
      } catch (err) {
        setError(err.response?.status === 404 ? 'Server không tồn tại hoặc đã bị xóa.' : 'Có lỗi xảy ra khi tải thông tin.');
      } finally {
        setLoading(false);
      }
    };
    fetchServerInfo();
  }, [serverId]);

  const handleJoin = async () => {
    if (!currentUser) {
      // Lưu lại URL hiện tại để sau khi đăng nhập sẽ quay lại đây
      sessionStorage.setItem('returnUrl', window.location.pathname);
      window.location.href = '/oauth2/authorization/google';
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(`/servers/${serverId}/join`);
      addServer(res.data);
      setCurrentServer(res.data);
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể tham gia server này.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--discord-bg)', color: 'white' }}>
        Đang tải...
      </div>
    );
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--discord-bg)',
      backgroundImage: 'url("https://theme.zdassets.com/theme_assets/678183/b7e9dce75f9edb23504e13b4699e208f204e5015.png")',
      backgroundSize: 'cover'
    }}>
      <div style={{
        background: 'var(--discord-sidebar)',
        padding: 32,
        borderRadius: 8,
        width: 480,
        textAlign: 'center',
        boxShadow: '0 8px 16px rgba(0,0,0,0.24)'
      }}>
        {error ? (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>😵</div>
            <h2 style={{ color: 'var(--discord-text-primary)' }}>Mã mời không hợp lệ</h2>
            <p style={{ color: 'var(--discord-text-secondary)', marginBottom: 24 }}>{error}</p>
            <button onClick={() => navigate('/')} className="btn-primary" style={{ width: '100%' }}>
              Trở về trang chủ
            </button>
          </>
        ) : (
          <>
            <img 
              src={serverInfo.iconUrl || 'https://via.placeholder.com/80'} 
              alt={serverInfo.name} 
              style={{ width: 80, height: 80, borderRadius: 24, marginBottom: 16 }}
            />
            <h3 style={{ color: 'var(--discord-text-secondary)', fontWeight: 600, fontSize: 16, marginBottom: 8, textTransform: 'uppercase' }}>
              Bạn được mời tham gia máy chủ
            </h3>
            <h2 style={{ color: 'var(--discord-text-primary)', fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
              {serverInfo.name}
            </h2>
            <button 
              onClick={handleJoin} 
              className="btn-primary" 
              style={{ width: '100%', padding: '12px 16px', fontSize: 16 }}
            >
              Chấp nhận lời mời
            </button>
            {!currentUser && (
              <p style={{ color: 'var(--discord-text-muted)', fontSize: 12, marginTop: 16 }}>
                Bạn cần đăng nhập để tham gia.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default InvitePage;
