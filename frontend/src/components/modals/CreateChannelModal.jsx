import React, { useState } from 'react';
import api from '../../api/axiosConfig';
import useServerStore from '../../store/useServerStore';
import { SERVER_PERMISSIONS, hasServerPermission } from '../../utils/serverPermissions';

const CreateChannelModal = ({ type = 'TEXT', onClose }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentServer, addChannel } = useServerStore();
  const canCreateChannel = hasServerPermission(currentServer, SERVER_PERMISSIONS.CHANNEL_CREATE);

  if (!currentServer || !canCreateChannel) {
    return null;
  }

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!canCreateChannel) { return; }
    if (!name.trim()) { setError('Tên channel không được rỗng'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await api.post(`/servers/${currentServer.id}/channels`, {
        name: name.trim().toLowerCase().replace(/\s+/g, '-'),
        type,
      });
      addChannel(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Tạo channel thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
          Tạo {type === 'VOICE' ? 'Voice' : 'Text'} Channel
        </h2>
        <p style={{ color: 'var(--discord-text-secondary)', fontSize: 14, marginBottom: 20 }}>
          Server: <strong>{currentServer?.name}</strong>
        </p>

        <form onSubmit={handleCreate}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: 'var(--discord-text-secondary)' }}>
            Tên channel
          </label>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--discord-input-bg)', borderRadius: 4, paddingLeft: 12, marginBottom: 20 }}>
            <span style={{ color: 'var(--discord-text-muted)' }}>
              {type === 'VOICE' ? '🔊' : '#'}
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="chung"
              style={{
                flex: 1, padding: '10px 8px', background: 'transparent',
                border: 'none', color: 'var(--discord-text-primary)',
                fontSize: 16, outline: 'none',
              }}
              autoFocus
            />
          </div>

          {error && <p style={{ color: 'var(--discord-red)', fontSize: 14, marginBottom: 12 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{
              padding: '10px 20px', background: 'transparent', border: 'none',
              color: 'var(--discord-text-secondary)', cursor: 'pointer', fontSize: 14,
            }}>Huỷ</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Đang tạo...' : 'Tạo channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateChannelModal;
