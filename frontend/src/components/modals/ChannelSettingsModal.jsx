import React, { useState } from 'react';
import api from '../../api/axiosConfig';
import useServerStore from '../../store/useServerStore';
import { SERVER_PERMISSIONS, hasServerPermission } from '../../utils/serverPermissions';

const ChannelSettingsModal = ({ channel, onClose }) => {
  const { currentServer, updateChannel, removeChannel } = useServerStore();
  const [name, setName] = useState(channel.name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const canUpdateChannel = hasServerPermission(currentServer, SERVER_PERMISSIONS.CHANNEL_UPDATE);
  const canDeleteChannel = hasServerPermission(currentServer, SERVER_PERMISSIONS.CHANNEL_DELETE);

  if (!canUpdateChannel && !canDeleteChannel) {
    return null;
  }

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!canUpdateChannel) { return; }
    if (!name.trim()) { setError('Tên kênh không được rỗng'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await api.put(`/servers/${currentServer.id}/channels/${channel.id}`, { 
        name: name.trim().toLowerCase().replace(/\s+/g, '-'),
        type: channel.type 
      });
      updateChannel(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Cập nhật kênh thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!canDeleteChannel) { return; }
    setLoading(true);
    setError('');
    try {
      await api.delete(`/servers/${currentServer.id}/channels/${channel.id}`);
      removeChannel(channel.id);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Xóa kênh thất bại');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Cài đặt Kênh {channel.type === 'TEXT' ? 'Văn bản' : 'Thoại'}</h2>
        <p style={{ color: 'var(--discord-text-secondary)', fontSize: 14, marginBottom: 20 }}>
          {channel.type === 'TEXT' ? '#' : '🔊'} {channel.name}
        </p>

        {!confirmDelete ? (
          <form onSubmit={handleUpdate}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: 'var(--discord-text-secondary)' }}>
              Tên kênh <span style={{ color: 'var(--discord-red)' }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', background: 'var(--discord-input-bg)',
                border: '1px solid var(--discord-divider)', borderRadius: 4,
                color: 'var(--discord-text-primary)', fontSize: 16, outline: 'none',
                marginBottom: 20,
              }}
              autoFocus
            />

            {error && <p style={{ color: 'var(--discord-red)', fontSize: 14, marginBottom: 12 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {canDeleteChannel && (
                  <button type="button" onClick={() => setConfirmDelete(true)} className="btn-danger" style={{ padding: '10px 20px', fontSize: 14 }}>
                    Xóa Kênh
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" onClick={onClose} style={{
                  padding: '10px 20px', background: 'transparent', border: 'none',
                  color: 'var(--discord-text-secondary)', cursor: 'pointer', fontSize: 14,
                }}>Huỷ</button>
                <button type="submit" className="btn-primary" disabled={loading || !canUpdateChannel}>
                  {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div>
            <h3 style={{ color: 'var(--discord-red)', marginBottom: 12 }}>Xóa Kênh "{channel.name}"?</h3>
            <p style={{ color: 'var(--discord-text-secondary)', fontSize: 14, marginBottom: 20 }}>
              Bạn có chắc chắn muốn xóa kênh này? Hành động này không thể hoàn tác.
            </p>
            {error && <p style={{ color: 'var(--discord-red)', fontSize: 14, marginBottom: 12 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setConfirmDelete(false)} style={{
                padding: '10px 20px', background: 'transparent', border: 'none',
                color: 'var(--discord-text-secondary)', cursor: 'pointer', fontSize: 14,
              }}>Huỷ</button>
              <button type="button" onClick={handleDelete} className="btn-danger" disabled={loading || !canDeleteChannel}>
                {loading ? 'Đang xóa...' : 'Xác nhận Xóa'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChannelSettingsModal;
