import React, { useState } from 'react';
import api from '../../api/axiosConfig';
import useServerStore from '../../store/useServerStore';
import useUserStore from '../../store/useUserStore';

const ServerSettingsModal = ({ onClose }) => {
  const { currentServer, updateServer, removeServer } = useServerStore();
  const { currentUser } = useUserStore();
  const [name, setName] = useState(currentServer?.name || '');
  const [iconUrl, setIconUrl] = useState(currentServer?.iconUrl || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Check if owner
  const isOwner = currentServer?.ownerId === currentUser?.id;

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Tên server không được rỗng'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await api.put(`/servers/${currentServer.id}`, { name: name.trim(), iconUrl: iconUrl || null });
      updateServer(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Cập nhật server thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError('');
    try {
      await api.delete(`/servers/${currentServer.id}`);
      removeServer(currentServer.id);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Xóa server thất bại');
      setLoading(false);
    }
  };

  if (!currentServer) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Cài đặt Server</h2>
        <p style={{ color: 'var(--discord-text-secondary)', fontSize: 14, marginBottom: 20 }}>
          {currentServer.name}
        </p>

        {!confirmDelete ? (
          <form onSubmit={handleUpdate}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: 'var(--discord-text-secondary)' }}>
              Tên server <span style={{ color: 'var(--discord-red)' }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', background: 'var(--discord-input-bg)',
                border: '1px solid var(--discord-divider)', borderRadius: 4,
                color: 'var(--discord-text-primary)', fontSize: 16, outline: 'none',
                marginBottom: 16,
              }}
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

            <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {isOwner && (
                  <button type="button" onClick={() => setConfirmDelete(true)} className="btn-danger" style={{ padding: '10px 20px', fontSize: 14 }}>
                    Xóa Server
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" onClick={onClose} style={{
                  padding: '10px 20px', background: 'transparent', border: 'none',
                  color: 'var(--discord-text-secondary)', cursor: 'pointer', fontSize: 14,
                }}>Huỷ</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div>
            <h3 style={{ color: 'var(--discord-red)', marginBottom: 12 }}>Bạn có chắc chắn muốn xóa Server này?</h3>
            <p style={{ color: 'var(--discord-text-secondary)', fontSize: 14, marginBottom: 20 }}>
              Hành động này không thể hoàn tác. Mọi dữ liệu kênh và tin nhắn sẽ bị xóa vĩnh viễn.
            </p>
            {error && <p style={{ color: 'var(--discord-red)', fontSize: 14, marginBottom: 12 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setConfirmDelete(false)} style={{
                padding: '10px 20px', background: 'transparent', border: 'none',
                color: 'var(--discord-text-secondary)', cursor: 'pointer', fontSize: 14,
              }}>Huỷ</button>
              <button type="button" onClick={handleDelete} className="btn-danger" disabled={loading}>
                {loading ? 'Đang xóa...' : 'Xác nhận Xóa'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServerSettingsModal;
