import React, { useState } from 'react';

/**
 * Hiển thị một tin nhắn: TEXT / IMAGE / FILE / REVOKED
 */
const MessageItem = ({ message, isOwn, onRevoke, showAvatar }) => {
  const [imgZoom, setImgZoom] = useState(false);

  if (message.revoked) {
    return (
      <div style={{
        fontStyle: 'italic',
        color: 'var(--discord-text-muted)',
        fontSize: 14,
        padding: '2px 0',
      }}>
        Tin nhắn đã bị thu hồi.
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {message.type === 'IMAGE' ? (
        <>
          <img
            src={message.fileUrl}
            alt={message.fileName || 'Ảnh'}
            style={{
              maxWidth: 400,
              maxHeight: 300,
              borderRadius: 8,
              cursor: 'zoom-in',
              objectFit: 'contain',
              display: 'block',
              marginTop: 4,
            }}
            onClick={() => setImgZoom(true)}
          />
          {/* Zoom modal */}
          {imgZoom && (
            <div
              onClick={() => setImgZoom(false)}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
                zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'zoom-out',
              }}
            >
              <img src={message.fileUrl} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8 }} />
            </div>
          )}
        </>
      ) : message.type === 'FILE' ? (
        <a
          href={message.fileUrl}
          download={message.fileName}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'var(--discord-input-bg)', borderRadius: 8,
            padding: '10px 14px', marginTop: 4,
            color: 'var(--discord-text-primary)', textDecoration: 'none',
            border: '1px solid var(--discord-divider)',
          }}
        >
          <span style={{ fontSize: 24 }}>📄</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{message.fileName}</div>
            <div style={{ fontSize: 12, color: 'var(--discord-accent)' }}>Tải xuống</div>
          </div>
        </a>
      ) : (
        <div style={{ fontSize: 15, color: 'var(--discord-text-primary)', wordBreak: 'break-word', lineHeight: 1.5 }}>
          {message.content}
        </div>
      )}
    </div>
  );
};

export default MessageItem;
