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
  }, [currentUser, setLoadingServers, setServers]);

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
      <div className="server-rail">
        <button
          type="button"
          className={`server-icon ${!currentServer ? 'active' : ''}`}
          onClick={() => setCurrentServer(null)}
          title="Home"
        >
          <BrandIcon />
        </button>

        <div className="server-divider" />

        <div className="server-rail__list">
          {servers.map((server) => (
            <button
              type="button"
              key={server.id}
              className={`server-icon ${currentServer?.id === server.id ? 'active' : ''}`}
              onClick={() => handleSelectServer(server)}
              title={server.name}
            >
              {server.iconUrl ? (
                <img src={server.iconUrl} alt={server.name} className="server-icon__image" />
              ) : (
                <span className="server-icon__label">{getServerInitials(server.name)}</span>
              )}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="server-icon server-icon--create"
          onClick={() => setShowCreateModal(true)}
          title="Tạo server mới"
        >
          <PlusIcon />
        </button>
      </div>

      {showCreateModal && (
        <CreateServerModal onClose={() => setShowCreateModal(false)} />
      )}
    </>
  );
};

const BrandIcon = () => (
  <svg viewBox="0 0 28 20" fill="currentColor" aria-hidden="true">
    <path d="M23.0212 1.67671C21.3107 0.879656 19.5079 0.318797 17.6584 0C17.4062 0.461742 17.1749 0.934541 16.9708 1.4184C15.003 1.12145 13.0135 1.12145 11.0854 1.4184C10.8813 0.923485 10.639 0.461742 10.3868 0C8.5262 0.318797 6.72336 0.880721 5.01287 1.67671C1.56727 6.77853 0.649666 11.7538 1.11108 16.652C3.10137 18.1415 5.3262 19.2743 7.69177 20C8.22338 19.2743 8.69519 18.4993 9.09812 17.6911C8.32996 17.3997 7.58522 17.0424 6.87684 16.6135C7.06531 16.4762 7.24726 16.3268 7.42341 16.1662C11.5911 18.1136 16.4862 18.1136 20.6219 16.1662C20.8039 16.3268 20.9859 16.4762 21.1687 16.6135C20.4603 17.0328 19.7156 17.3997 18.9474 17.6911C19.3503 18.4993 19.8221 19.2743 20.3537 20C22.7193 19.2743 24.9441 18.1415 26.9344 16.652C27.4988 10.9743 26.0436 6.09635 23.0212 1.67671ZM9.68009 13.6383C8.39754 13.6383 7.34085 12.4453 7.34085 10.994C7.34085 9.54272 8.37155 8.34973 9.68009 8.34973C10.9886 8.34973 12.0395 9.54272 12.0187 10.994C12.0187 12.4453 10.9886 13.6383 9.68009 13.6383ZM18.3161 13.6383C17.0336 13.6383 15.9769 12.4453 15.9769 10.994C15.9769 9.54272 17.0076 8.34973 18.3161 8.34973C19.6246 8.34973 20.6755 9.54272 20.6547 10.994C20.6547 12.4453 19.6246 13.6383 18.3161 13.6383Z" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);

export default ServerList;
