import React, { useState, useRef } from 'react';
import api from '../../api/axiosConfig';
import useUserStore from '../../store/useUserStore';

const ProfileModal = ({ onClose }) => {
  const { currentUser, setCurrentUser } = useUserStore();
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(currentUser?.avatarUrl || '');
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File quá lớn (tối đa 10MB)');
      return;
    }

    // Hiển thị preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Upload ngay lập tức hoặc đợi bấm Save? 
    // Theo style Discord là chọn xong bấm Save. 
    // Tuy nhiên để đơn giản và chắc chắn, mình sẽ upload khi bấm Save.
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Tên hiển thị không được để trống');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let updatedUser = { ...currentUser };

      // 1. Cập nhật tên nếu có thay đổi
      if (displayName !== currentUser.displayName) {
        const resName = await api.put('/users/profile', { displayName: displayName.trim() });
        updatedUser = resName.data;
      }

      // 2. Upload avatar nếu có file mới
      if (fileInputRef.current?.files[0]) {
        const formData = new FormData();
        formData.append('file', fileInputRef.current.files[0]);
        const resAvatar = await api.post('/users/profile/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        updatedUser = resAvatar.data;
      }

      setCurrentUser(updatedUser);
      onClose();
    } catch (err) {
      console.error('Lỗi cập nhật profile:', err);
      setError(err.response?.data?.error || 'Cập nhật thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Cài đặt hồ sơ</h2>

        <form onSubmit={handleSave}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24, gap: 16 }}>
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
              <img 
                src={previewUrl || 'https://via.placeholder.com/80'} 
                alt="Avatar Preview" 
                style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--discord-bg-primary)' }}
              />
              <div style={{ 
                position: 'absolute', bottom: 0, right: 0, 
                background: 'var(--discord-bg-primary)', padding: 4, 
                borderRadius: '50%', fontSize: 14, border: '1px solid var(--discord-divider)'
              }}>📷</div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              style={{ display: 'none' }} 
            />
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              style={{ 
                background: 'var(--discord-bg-secondary)', color: 'white', 
                border: 'none', padding: '6px 16px', borderRadius: 4, fontSize: 13, cursor: 'pointer' 
              }}
            >
              Thay đổi ảnh đại diện
            </button>
          </div>

          <label style={{ 
            display: 'block', marginBottom: 8, fontSize: 12, 
            fontWeight: 700, color: 'var(--discord-text-secondary)', textTransform: 'uppercase' 
          }}>
            Tên hiển thị
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            style={{
              width: '100%', padding: '10px', background: 'var(--discord-input-bg)',
              border: 'none', borderRadius: 4, color: 'var(--discord-text-primary)',
              fontSize: 16, marginBottom: 20, outline: 'none'
            }}
          />

          {error && <p style={{ color: 'var(--discord-red)', fontSize: 14, marginBottom: 16 }}>{error}</p>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
            <button 
              type="button" 
              onClick={onClose} 
              style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
            >
              Hủy
            </button>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading}
              style={{ padding: '10px 24px' }}
            >
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;
