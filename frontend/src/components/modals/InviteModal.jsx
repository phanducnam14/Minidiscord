import React, { useState } from 'react';

const InviteModal = ({ server, onClose }) => {
  const [copied, setCopied] = useState(false);
  const inviteLink = `http://localhost:3000/invite/${server.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: 24, paddingBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Mời bạn bè vào <span style={{ color: 'var(--discord-brand)' }}>{server.name}</span></h2>
        <p style={{ color: 'var(--discord-text-secondary)', fontSize: 14, marginBottom: 20 }}>
          Gửi liên kết này cho bạn bè để rủ họ vào server nha!
        </p>

        <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: 'var(--discord-text-secondary)' }}>
          Gửi liên kết máy chủ cho một người bạn
        </label>
        
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            readOnly
            value={inviteLink}
            style={{
              flex: 1, padding: '10px 14px', background: 'var(--discord-input-bg)',
              border: '1px solid var(--discord-divider)', borderRadius: 4,
              color: 'var(--discord-text-primary)', fontSize: 14, outline: 'none',
              fontFamily: 'monospace'
            }}
          />
          <button 
            onClick={handleCopy} 
            className="btn-primary" 
            style={{ padding: '0 20px', background: copied ? 'var(--discord-green)' : 'var(--discord-brand)', transition: 'background 0.2s' }}
          >
            {copied ? 'Đã sao chép' : 'Sao chép'}
          </button>
        </div>

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
          <button onClick={onClose} style={{
              padding: '10px 20px', background: 'transparent', border: 'none',
              color: 'var(--discord-text-secondary)', cursor: 'pointer', fontSize: 14,
            }}>Đóng</button>
        </div>
      </div>
    </div>
  );
};

export default InviteModal;
