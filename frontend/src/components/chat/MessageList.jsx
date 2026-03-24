import React from 'react';
import MessageItem from './MessageItem';

/**
 * Nhóm tin nhắn liên tiếp cùng người (< 5 phút) giống Discord
 */
const MessageList = ({ messages, currentUserId, onRevoke }) => {
  if (!messages || messages.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--discord-text-muted)', padding: '40px 16px', fontSize: 14 }}>
        Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
      </div>
    );
  }

  // Tạo danh sách groups
  const groups = [];
  let currentGroup = null;

  messages.forEach((msg, idx) => {
    const prev = messages[idx - 1];
    const sameUser = prev && prev.senderId === msg.senderId;
    const withinTime = prev && (new Date(msg.createdAt) - new Date(prev.createdAt)) < 5 * 60 * 1000;
    const isGrouped = sameUser && withinTime && !prev.revoked && !msg.revoked;

    if (!isGrouped) {
      currentGroup = { header: msg, messages: [msg] };
      groups.push(currentGroup);
    } else {
      currentGroup.messages.push(msg);
    }
  });

  return (
    <div style={{ paddingBottom: 8 }}>
      {groups.map((group, gi) => (
        <div key={group.header.id || gi} className="animate-fade-in">
          {/* Header của group (avatar + tên) */}
          <div className="message-group" style={{ paddingTop: 16, alignItems: 'flex-start' }}>
            <img
              src={group.header.senderAvatar || 'https://via.placeholder.com/40'}
              alt={group.header.senderName}
              className="avatar"
              style={{ width: 40, height: 40, marginTop: 0 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 500, fontSize: 16, color: 'var(--discord-text-primary)' }}>
                  {group.header.senderName}
                </span>
                <span style={{ fontSize: 12, color: 'var(--discord-text-muted)' }}>
                  {formatTime(group.header.createdAt)}
                </span>
              </div>
              {group.messages.map((msg) => (
                <MessageItem
                  key={msg.id}
                  message={msg}
                  isOwn={msg.senderId === currentUserId}
                  onRevoke={onRevoke}
                  showAvatar={false}
                />
              ))}
            </div>
            {/* Actions zone chỉ cho tin đầu */}
            {group.messages[0].senderId === currentUserId && !group.messages[0].revoked && (
              <div className="message-actions">
                <div
                  className="message-action-btn"
                  onClick={() => onRevoke(group.messages[0].id)}
                  title="Thu hồi"
                >✕ Thu hồi</div>
              </div>
            )}
          </div>

          {/* Các tin tiếp theo trong group (không hiện avatar) */}
          {group.messages.slice(1).map((msg) => (
            <div key={msg.id} className="message-group" style={{ paddingLeft: 72, paddingTop: 2 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <MessageItem
                  message={msg}
                  isOwn={msg.senderId === currentUserId}
                  onRevoke={onRevoke}
                  showAvatar={false}
                />
              </div>
              {msg.senderId === currentUserId && !msg.revoked && (
                <div className="message-actions">
                  <div className="message-action-btn" onClick={() => onRevoke(msg.id)}>✕ Thu hồi</div>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export default MessageList;
