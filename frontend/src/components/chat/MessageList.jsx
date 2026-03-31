import React from 'react';
import MessageItem from './MessageItem';

/**
 * Nhóm tin nhắn liên tiếp cùng người (< 5 phút) giống Discord
 */
const MessageList = ({ messages, currentUserId, onRevoke, onReaction }) => {
  if (!messages || messages.length === 0) {
    return (
      <div className="message-list-empty">
        Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
      </div>
    );
  }

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
    <div className="message-list">
      {groups.map((group, gi) => (
        <div key={group.header.id || gi} className="animate-fade-in group">
          <div className="message-group">
            <img
              src={group.header.senderAvatar || 'https://via.placeholder.com/40'}
              alt={group.header.senderName}
              className="avatar message-group__avatar"
            />
            <div className="message-group__body">
              <div className="message-group__meta">
                <span className="message-group__author">{group.header.senderName}</span>
                <span className="message-group__timestamp">{formatTime(group.header.createdAt)}</span>
              </div>
              {group.messages.map((msg) => (
                <MessageItem
                  key={msg.id}
                  message={msg}
                  isOwn={msg.senderId === currentUserId}
                  onRevoke={onRevoke}
                  onReaction={onReaction}
                  currentUserId={currentUserId}
                  showAvatar={false}
                />
              ))}
            </div>
          </div>
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
