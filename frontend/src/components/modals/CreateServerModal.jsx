import React, { useState } from 'react';
import api from '../../api/axiosConfig';
import useServerStore from '../../store/useServerStore';
import useUserStore from '../../store/useUserStore';

const CreateServerModal = ({ onClose }) => {
  const [name, setName] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { addServer, setCurrentServer, setChannels } = useServerStore();

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Tên server không được rỗng'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/servers', { name: name.trim(), iconUrl: iconUrl || null });
      addServer(res.data);
      setCurrentServer(res.data);
      setChannels([]);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Tạo server thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Tạo server mới</h2>
        <p style={{ color: 'var(--discord-text-secondary)', fontSize: 14, marginBottom: 20 }}>
          Tạo không gian chat riêng cho cộng đồng của bạn.
        </p>

        <form onSubmit={handleCreate}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: 'var(--discord-text-secondary)' }}>
            Tên server <span style={{ color: 'var(--discord-red)' }}>*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Server của tôi"
            style={{
              width: '100%', padding: '10px 14px', background: 'var(--discord-input-bg)',
              border: '1px solid var(--discord-divider)', borderRadius: 4,
              color: 'var(--discord-text-primary)', fontSize: 16, outline: 'none',
              marginBottom: 16,
            }}
            autoFocus
          />

          <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: 'var(--discord-text-secondary)' }}>
            URL icon (tùy chọn)
          </label>
          <input
            type="url"
            value={iconUrl}
            onChange={(e) => setIconUrl(e.target.value)}
            placeholder="https://example.com/icon.png"
            style={{
              width: '100%', padding: '10px 14px', background: 'var(--discord-input-bg)',
              border: '1px solid var(--discord-divider)', borderRadius: 4,
              color: 'var(--discord-text-primary)', fontSize: 16, outline: 'none',
              marginBottom: 20,
            }}
          />

          {error && <p style={{ color: 'var(--discord-red)', fontSize: 14, marginBottom: 12 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{
              padding: '10px 20px', background: 'transparent', border: 'none',
              color: 'var(--discord-text-secondary)', cursor: 'pointer', fontSize: 14,
            }}>Huỷ</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Đang tạo...' : 'Tạo server'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateServerModal;
