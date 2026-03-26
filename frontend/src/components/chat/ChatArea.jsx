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
  const channelIdRef = useRef(null);
  const subCleanups = useRef([]);
  const isLoadingRef = useRef(false);
  const activeLoadRequestRef = useRef(0);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const loadMessages = useCallback(async (channelId, pageNum, reset = false) => {
    if (isLoadingRef.current && !reset) return;

    const requestId = activeLoadRequestRef.current + 1;
    activeLoadRequestRef.current = requestId;

    isLoadingRef.current = true;
    setIsLoading(true);

    try {
      const res = await api.get(`/channels/${channelId}/messages?page=${pageNum}&size=50`);
      const fetched = res.data || [];
      const sorted = [...fetched].reverse();

      if (channelIdRef.current !== channelId || activeLoadRequestRef.current !== requestId) {
        return;
      }

      setMessages((prev) => reset ? sorted : [...sorted, ...prev]);
      setHasMore(fetched.length === 50);

      if (reset) {
        setTimeout(scrollToBottom, 100);
      }
    } catch (e) {
      if (channelIdRef.current === channelId && activeLoadRequestRef.current === requestId) {
        console.error('Lỗi load messages:', e);
      }
    } finally {
      if (activeLoadRequestRef.current === requestId) {
        isLoadingRef.current = false;
        setIsLoading(false);
      }
    }
  }, [scrollToBottom]);

  useEffect(() => {
    if (!currentChannel) return;

    channelIdRef.current = currentChannel.id;
    setMessages([]);
    setPage(0);
    setHasMore(true);
    setTypingUsers([]);

    subCleanups.current.forEach((fn) => typeof fn === 'function' && fn());
    subCleanups.current = [];

    loadMessages(currentChannel.id, 0, true);

    if (wsHook) {
      const unsubMsg = wsHook.subscribe(
        `/topic/channel/${currentChannel.id}`,
        (msg) => {
          if (channelIdRef.current !== currentChannel.id) return;
          if (msg.type === 'SEND') {
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
            setMessages((prev) =>
              prev.map((m) => m.id === msg.messageId ? { ...m, revoked: true } : m)
            );
          } else if (msg.type === 'REACTION') {
            setMessages((prev) =>
              prev.map((m) => m.id === msg.messageId ? { ...m, reactions: msg.reactions } : m)
            );
          }
        }
      );

      const unsubTyping = wsHook.subscribe(
        `/topic/channel/${currentChannel.id}/typing`,
        (msg) => {
          if (msg.senderId === currentUser?.id) return;
          setTypingUsers((prev) => {
            if (prev.find((u) => u.id === msg.senderId)) return prev;
            return [...prev, { id: msg.senderId, name: msg.senderName }];
          });
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
  }, [currentChannel, currentUser?.id, loadMessages, scrollToBottom, wsHook]);

  const handleScroll = useCallback((e) => {
    const el = e.target;
    if (el.scrollTop < 50 && hasMore && !isLoading) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadMessages(currentChannel.id, nextPage);
    }
  }, [page, hasMore, isLoading, currentChannel?.id, loadMessages]);

  const handleRevoke = (messageId) => {
    wsHook?.publish(`/app/chat/${currentChannel.id}/revoke/${messageId}`, {});
  };

  const handleReaction = (messageId, emoji) => {
    wsHook?.publish(`/app/chat/${currentChannel.id}/reaction/${messageId}`, { content: emoji });
  };

  if (!currentChannel) return null;

  return (
    <div className="chat-shell">
      <div className="chat-header">
        <span className="chat-header__icon">
          <HashIcon />
        </span>
        <div className="chat-header__meta">
          <span className="chat-header__title">{currentChannel.name}</span>
          <span className="chat-header__subtitle">Kênh văn bản</span>
        </div>
      </div>

      <div className="chat-scroll" onScroll={handleScroll}>
        {isLoading && <div className="chat-status">Đang tải tin nhắn...</div>}
        <MessageList
          messages={messages}
          currentUserId={currentUser?.id}
          onRevoke={handleRevoke}
          onReaction={handleReaction}
        />
        <div ref={bottomRef} />
      </div>

      {typingUsers.length > 0 && (
        <div className="chat-typing">
          <span className="typing-dots"><span /><span /><span /></span>
          <span>{typingUsers.map((u) => u.name).join(', ')} đang gõ...</span>
        </div>
      )}

      <ChatInput wsHook={wsHook} scrollToBottom={scrollToBottom} />
    </div>
  );
};

const HashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 9h14" />
    <path d="M5 15h14" />
    <path d="M10 4 8 20" />
    <path d="m16 4-2 16" />
  </svg>
);

export default ChatArea;
