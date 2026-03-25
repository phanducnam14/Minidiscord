import React, { useEffect, useRef, useState, useCallback } from 'react';
import api from '../../api/axiosConfig';
import useServerStore from '../../store/useServerStore';
import useUserStore from '../../store/useUserStore';
import MessageList from './MessageList';
import ChatInput from './ChatInput';

/**
 * ChatArea: load lịch sử + subscribe WebSocket cho text channel
 */
const ChatArea = ({ wsHook }) => {
  const { currentChannel } = useServerStore();
  const { currentUser } = useUserStore();

  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);

  const bottomRef = useRef(null);
  const topRef = useRef(null);
  const channelIdRef = useRef(null);
  const subCleanups = useRef([]);

  // Mỗi khi đổi channel → reset messages và load lại
  useEffect(() => {
    if (!currentChannel) return;

    channelIdRef.current = currentChannel.id;
    setMessages([]);
    setPage(0);
    setHasMore(true);
    setTypingUsers([]);

    // Dọn dẹp subscription cũ
    subCleanups.current.forEach((fn) => typeof fn === 'function' && fn());
    subCleanups.current = [];

    // Load trang đầu
    loadMessages(currentChannel.id, 0, true);

    // Subscribe tin nhắn mới
    if (wsHook) {
      const unsubMsg = wsHook.subscribe(
        `/topic/channel/${currentChannel.id}`,
        (msg) => {
          if (channelIdRef.current !== currentChannel.id) return;
          if (msg.type === 'SEND') {
            // Thêm tin nhắn mới
            const newMsg = {
              id: msg.messageId,
              channelId: msg.channelId,
              senderId: msg.senderId,
              senderName: msg.senderName,
              senderAvatar: msg.senderAvatar,
              content: msg.content,
              type: msg.messageType || 'TEXT',
              fileUrl: msg.fileUrl,
              fileName: msg.fileName,
              revoked: false,
              createdAt: msg.timestamp,
            };
            setMessages((prev) => [...prev, newMsg]);
            scrollToBottom();
          } else if (msg.type === 'REVOKE') {
            // Đánh dấu tin nhắn đã thu hồi
            setMessages((prev) =>
              prev.map((m) => m.id === msg.messageId ? { ...m, revoked: true } : m)
            );
          } else if (msg.type === 'REACTION') {
            // Cập nhật reactions cho tin nhắn cụ thể
            setMessages((prev) =>
              prev.map((m) => m.id === msg.messageId ? { ...m, reactions: msg.reactions } : m)
            );
          }
        }
      );

      // Subscribe typing indicator
      const unsubTyping = wsHook.subscribe(
        `/topic/channel/${currentChannel.id}/typing`,
        (msg) => {
          if (msg.senderId === currentUser?.id) return;
          setTypingUsers((prev) => {
            if (prev.find((u) => u.id === msg.senderId)) return prev;
            return [...prev, { id: msg.senderId, name: msg.senderName }];
          });
          // Xoá typing sau 3 giây
          setTimeout(() => {
            setTypingUsers((prev) => prev.filter((u) => u.id !== msg.senderId));
          }, 3000);
        }
      );

      subCleanups.current = [unsubMsg, unsubTyping].filter(Boolean);
    }

    return () => {
      subCleanups.current.forEach((fn) => typeof fn === 'function' && fn());
      subCleanups.current = [];
    };
  }, [currentChannel?.id]);

  const loadMessages = async (channelId, pageNum, reset = false) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const res = await api.get(`/channels/${channelId}/messages?page=${pageNum}&size=50`);
      const fetched = res.data || [];
      // API trả về DESC nên đảo lại
      const sorted = [...fetched].reverse();
      setMessages((prev) => reset ? sorted : [...sorted, ...prev]);
      setHasMore(fetched.length === 50);
      if (reset) setTimeout(scrollToBottom, 100);
    } catch (e) {
      console.error('Lỗi load messages:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Infinite scroll lên trên để load trang cũ hơn
  const handleScroll = useCallback((e) => {
    const el = e.target;
    if (el.scrollTop < 50 && hasMore && !isLoading) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadMessages(currentChannel.id, nextPage);
    }
  }, [page, hasMore, isLoading, currentChannel?.id]);

  const handleRevoke = (messageId) => {
    wsHook?.publish(`/app/chat/${currentChannel.id}/revoke/${messageId}`, {});
  };

  const handleReaction = (messageId, emoji) => {
    wsHook?.publish(`/app/chat/${currentChannel.id}/reaction/${messageId}`, { content: emoji });
  };

  if (!currentChannel) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Channel header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--discord-bg-primary)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 24, color: 'var(--discord-text-muted)' }}>#</span>
        <span style={{ fontWeight: 700, fontSize: 16 }}>{currentChannel.name}</span>
      </div>

      {/* Message list với scroll */}
      <div
        style={{ flex: 1, overflowY: 'auto', paddingTop: 8 }}
        onScroll={handleScroll}
      >
        {isLoading && (
          <div style={{ textAlign: 'center', padding: 12, color: 'var(--discord-text-muted)', fontSize: 13 }}>
            Đang tải...
          </div>
        )}
        <MessageList
          messages={messages}
          currentUserId={currentUser?.id}
          onRevoke={handleRevoke}
          onReaction={handleReaction}
        />
        <div ref={bottomRef} />
      </div>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div style={{ padding: '4px 16px', fontSize: 13, color: 'var(--discord-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="typing-dots"><span/><span/><span/></span>
          <span>
            {typingUsers.map((u) => u.name).join(', ')} đang gõ...
          </span>
        </div>
      )}

      {/* Chat input */}
      <ChatInput wsHook={wsHook} scrollToBottom={scrollToBottom} />
    </div>
  );
};

export default ChatArea;
