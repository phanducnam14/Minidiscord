import React, { useEffect, useState } from 'react';
import useServerStore from '../../store/useServerStore';
import useUserStore from '../../store/useUserStore';
import api from '../../api/axiosConfig';
import CreateServerModal from '../modals/CreateServerModal';

/**
 * Danh sách server dạng icon tròn ở cột trái ngoài cùng
 */
const ServerList = () => {
  const { servers, currentServer, setServers, setCurrentServer, setChannels, setLoadingServers } = useServerStore();
  const { currentUser } = useUserStore();
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const fetchServers = async () => {
      setLoadingServers(true);
      try {
        const res = await api.get('/servers/my');
        setServers(res.data);
      } catch (e) {
        console.error('Lỗi fetch servers:', e);
      } finally {
        setLoadingServers(false);
      }
    };
    fetchServers();
  }, [currentUser]);

  const handleSelectServer = async (server) => {
    setCurrentServer(server);
    try {
      const res = await api.get(`/servers/${server.id}/channels`);
      setChannels(res.data);
    } catch (e) {
      console.error('Lỗi fetch channels:', e);
    }
  };

  const getServerInitials = (name) => {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <>
      <div style={{
        width: 72,
        background: 'var(--discord-bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '12px 0',
        gap: 8,
        overflowY: 'auto',
      }}>
        {/* Home button */}
        <div
          className={`server-icon ${!currentServer ? 'active' : ''}`}
          onClick={() => setCurrentServer(null)}
          title="Home"
          style={{ background: currentServer ? undefined : 'var(--discord-accent)' }}
        >
          <span style={{ fontSize: 22 }}>🏠</span>
        </div>

        <div style={{ width: 32, height: 2, background: 'var(--discord-divider)', borderRadius: 1 }} />

        {/* Server icons */}
        {servers.map((server) => (
          <div
            key={server.id}
            className={`server-icon ${currentServer?.id === server.id ? 'active' : ''}`}
            onClick={() => handleSelectServer(server)}
            title={server.name}
          >
            {server.iconUrl ? (
              <img src={server.iconUrl} alt={server.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 14, fontWeight: 700 }}>{getServerInitials(server.name)}</span>
            )}
          </div>
        ))}

        {/* Nút tạo server */}
        <div
          className="server-icon"
          onClick={() => setShowCreateModal(true)}
          title="Tạo server mới"
          style={{ color: 'var(--discord-green)', border: '2px dashed var(--discord-green)', background: 'transparent' }}
        >
          <span style={{ fontSize: 28, lineHeight: 1 }}>+</span>
        </div>
      </div>

      {showCreateModal && (
        <CreateServerModal onClose={() => setShowCreateModal(false)} />
      )}
    </>
  );
};

export default ServerList;
