import React, { useMemo, useState } from 'react';
import useServerStore from '../../store/useServerStore';
import useUserStore from '../../store/useUserStore';
import {
  buildMemberDirectory,
  createDisplayNameResolver,
  messageMentionsUser,
  parseMentionParts,
} from '../../utils/mentionUtils';

/**
 * Hien thi mot tin nhan: TEXT / IMAGE / FILE / REVOKED
 */
const MessageItem = ({ message, isOwn, onRevoke, onReaction, currentUserId }) => {
  const { currentServer } = useServerStore();
  const { currentUser } = useUserStore();

  const [imgZoom, setImgZoom] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);

  const memberDirectory = useMemo(
    () => buildMemberDirectory(currentServer?.members || [], currentUser),
    [currentServer?.members, currentUser]
  );
  const resolveDisplayName = useMemo(
    () => createDisplayNameResolver(memberDirectory),
    [memberDirectory]
  );

  if (message.revoked) {
    return (
      <div style={{ fontStyle: 'italic', color: 'var(--discord-text-muted)', fontSize: 14, padding: '2px 0' }}>
        Tin nhan da bi thu hoi.
      </div>
    );
  }

  const emojis = ['❤️', '👍', '😂', '😢', '🔥', '👏'];
  const isMentioned = messageMentionsUser(message, currentUserId);

  const renderMessageText = () => {
    const parts = parseMentionParts(message.content || '');

    if (!parts.length) {
      return null;
    }

    return parts.map((part, index) => {
      if (part.type === 'mention') {
        return (
          <span key={`mention-${part.userId}-${index}`} className="mention-chip mention-chip--message">
            @{resolveDisplayName(part.userId)}
          </span>
        );
      }

      return <React.Fragment key={`text-${index}`}>{part.value}</React.Fragment>;
    });
  };

  return (
    <div
      className={`message-item-container ${isMentioned ? 'message-item-container--mention' : ''}`}
      onMouseEnter={() => setShowToolbar(true)}
      onMouseLeave={() => setShowToolbar(false)}
      style={{ position: 'relative', marginBottom: 2, paddingRight: 40 }}
    >
      <div style={{ position: 'relative', zIndex: 1 }}>
        {message.type === 'IMAGE' ? (
          <>
            <img
              src={message.fileUrl}
              alt={message.fileName || 'Anh'}
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
            href={message.fileUrl}
            download={message.fileName}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'var(--discord-input-bg)', borderRadius: 8, padding: '10px 14px', marginTop: 4, color: 'var(--discord-text-primary)', textDecoration: 'none', border: '1px solid var(--discord-divider)' }}
          >
            <span style={{ fontSize: 24 }}>📄</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{message.fileName}</div>
              <div style={{ fontSize: 12, color: 'var(--discord-accent)' }}>Tai xuong</div>
            </div>
          </a>
        ) : (
          <div className="message-text">
            {renderMessageText()}
          </div>
        )}
      </div>

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
                title={`${userIds.length} nguoi da tha cam xuc`}
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

      {showToolbar && (
        <div style={{
          position: 'absolute', top: -16, right: 0,
          background: 'var(--discord-user-area)', borderRadius: 4,
          padding: '2px 4px', display: 'flex', gap: 4,
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)', border: '1px solid var(--discord-divider)',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', gap: 2, paddingRight: 4, borderRight: '1px solid var(--discord-divider)' }}>
            {emojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => onReaction(message.id, emoji)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 16, padding: '2px', borderRadius: 4 }}
                className="toolbar-btn"
              >{emoji}</button>
            ))}
          </div>

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
