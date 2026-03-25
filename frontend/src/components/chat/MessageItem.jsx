import React, { useState } from 'react';

/**
 * Hiển thị một tin nhắn: TEXT / IMAGE / FILE / REVOKED
 */
const MessageItem = ({ message, isOwn, onRevoke, onReaction, currentUserId }) => {
  const [imgZoom, setImgZoom] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);

  if (message.revoked) {
    return (
      <div style={{ fontStyle: 'italic', color: 'var(--discord-text-muted)', fontSize: 14, padding: '2px 0' }}>
        Tin nhắn đã bị thu hồi.
      </div>
    );
  }

  const emojis = ['❤️', '👍', '😂', '😢', '🔥', '👏'];

  return (
    <div 
      className="message-item-container"
      onMouseEnter={() => setShowToolbar(true)}
      onMouseLeave={() => setShowToolbar(false)}
      style={{ position: 'relative', marginBottom: 2, paddingRight: 40 }}
    >
      {/* Message content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {message.type === 'IMAGE' ? (
          <>
            <img
              src={message.fileUrl}
              alt={message.fileName || 'Ảnh'}
              style={{ maxWidth: 400, maxHeight: 300, borderRadius: 8, cursor: 'zoom-in', objectFit: 'contain', display: 'block', marginTop: 4 }}
              onClick={() => setImgZoom(true)}
            />
            {imgZoom && (
              <div
                onClick={() => setImgZoom(false)}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}
              >
                <img src={message.fileUrl} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8 }} />
              </div>
            )}
          </>
        ) : message.type === 'FILE' ? (
          <a
            href={message.fileUrl} download={message.fileName}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'var(--discord-input-bg)', borderRadius: 8, padding: '10px 14px', marginTop: 4, color: 'var(--discord-text-primary)', textDecoration: 'none', border: '1px solid var(--discord-divider)' }}
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

      {/* Reactions Display */}
      {message.reactions && Object.keys(message.reactions).length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
          {Object.entries(message.reactions).map(([emoji, userIds]) => {
            const hasReacted = userIds.includes(currentUserId);
            return (
              <div
                key={emoji}
                onClick={() => onReaction(message.id, emoji)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '2px 6px', borderRadius: 6,
                  background: hasReacted ? 'rgba(88, 101, 242, 0.15)' : 'var(--discord-bg-primary)',
                  border: `1px solid ${hasReacted ? 'var(--discord-brand)' : 'transparent'}`,
                  cursor: 'pointer', fontSize: 12, transition: 'all 0.1s ease',
                  userSelect: 'none'
                }}
                className="reaction-tag"
                title={userIds.length + " người đã thả cảm xúc"}
              >
                <span>{emoji}</span>
                <span style={{ color: hasReacted ? 'var(--discord-text-primary)' : 'var(--discord-text-muted)', fontWeight: 600 }}>
                  {userIds.length}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Toolbar on hover */}
      {showToolbar && (
        <div style={{
          position: 'absolute', top: -16, right: 0,
          background: 'var(--discord-user-area)', borderRadius: 4,
          padding: '2px 4px', display: 'flex', gap: 4,
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)', border: '1px solid var(--discord-divider)',
          zIndex: 10
        }}>
          {/* Fast reactions */}
          <div style={{ display: 'flex', gap: 2, paddingRight: 4, borderRight: '1px solid var(--discord-divider)' }}>
            {emojis.map(e => (
              <button 
                key={e} 
                onClick={() => onReaction(message.id, e)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 16, padding: '2px', borderRadius: 4 }}
                className="toolbar-btn"
              >{e}</button>
            ))}
          </div>
          
          {/* Other actions */}
          {isOwn && (
            <button
              onClick={() => onRevoke(message.id)}
              style={{ background: 'transparent', border: 'none', color: 'var(--discord-red)', cursor: 'pointer', fontSize: 14, padding: '2px 6px', fontWeight: 600 }}
              className="toolbar-btn"
            >✕</button>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageItem;
