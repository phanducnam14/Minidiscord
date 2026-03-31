import React, { useEffect, useRef, useState, useCallback } from 'react';
import api from '../../api/axiosConfig';
import useServerStore from '../../store/useServerStore';
import useUserStore from '../../store/useUserStore';
import useUnreadStore from '../../store/useUnreadStore';
import MessageList from './MessageList';
import ChatInput from './ChatInput';

const normalizeMessage = (message) => ({
  ...message,
  mentionedUserIds: message?.mentionedUserIds || [],
  reactions: message?.reactions || {},
});

/**
 * ChatArea: load lich su + subscribe WebSocket cho text channel
 */
const ChatArea = ({ wsHook }) => {
  const { currentChannel } = useServerStore();
  const { currentUser } = useUserStore();
  const setUnreadSnapshot = useUnreadStore((state) => state.setSnapshot);

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
  const readTimeoutRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const scheduleMarkChannelRead = useCallback((channelId, delay = 120) => {
    if (!channelId) {
      return;
    }

    if (readTimeoutRef.current) {
      clearTimeout(readTimeoutRef.current);
    }

    readTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await api.post(`/channels/${channelId}/read`);
        if (channelIdRef.current === channelId) {
          setUnreadSnapshot(res.data);
        }
      } catch (error) {
        console.error('Loi cap nhat trang thai da doc:', error);
      } finally {
        readTimeoutRef.current = null;
      }
    }, delay);
  }, [setUnreadSnapshot]);

  const loadMessages = useCallback(async (channelId, pageNum, reset = false) => {
    if (isLoadingRef.current && !reset) return;

    const requestId = activeLoadRequestRef.current + 1;
    activeLoadRequestRef.current = requestId;

    isLoadingRef.current = true;
    setIsLoading(true);

    try {
      const res = await api.get(`/channels/${channelId}/messages?page=${pageNum}&size=50`);
      const fetched = res.data || [];
      const sorted = [...fetched].reverse().map(normalizeMessage);

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
        console.error('Loi load messages:', e);
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
    scheduleMarkChannelRead(currentChannel.id, 0);

    if (wsHook) {
      const unsubMsg = wsHook.subscribe(
        `/topic/channel/${currentChannel.id}`,
        (msg) => {
          if (channelIdRef.current !== currentChannel.id) return;
          if (msg.type === 'SEND') {
            const newMsg = normalizeMessage({
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
              mentionedUserIds: msg.mentionedUserIds,
              reactions: msg.reactions,
            });
            setMessages((prev) => [...prev, newMsg]);
            scrollToBottom();

            if (msg.senderId !== currentUser?.id) {
              scheduleMarkChannelRead(currentChannel.id);
            }
          } else if (msg.type === 'REVOKE') {
            setMessages((prev) =>
              prev.map((message) => (
                message.id === msg.messageId ? { ...message, revoked: true } : message
              ))
            );
          } else if (msg.type === 'REACTION') {
            setMessages((prev) =>
              prev.map((message) => (
                message.id === msg.messageId
                  ? normalizeMessage({ ...message, reactions: msg.reactions })
                  : message
              ))
            );
          }
        }
      );

      const unsubTyping = wsHook.subscribe(
        `/topic/channel/${currentChannel.id}/typing`,
        (msg) => {
          if (msg.senderId === currentUser?.id) return;
          setTypingUsers((prev) => {
            if (prev.find((user) => user.id === msg.senderId)) return prev;
            return [...prev, { id: msg.senderId, name: msg.senderName }];
          });
          setTimeout(() => {
            setTypingUsers((prev) => prev.filter((user) => user.id !== msg.senderId));
          }, 3000);
        }
      );

      subCleanups.current = [unsubMsg, unsubTyping].filter(Boolean);
    }

    return () => {
      subCleanups.current.forEach((fn) => typeof fn === 'function' && fn());
      subCleanups.current = [];

      if (readTimeoutRef.current) {
        clearTimeout(readTimeoutRef.current);
        readTimeoutRef.current = null;
      }
    };
  }, [currentChannel, currentUser?.id, loadMessages, scheduleMarkChannelRead, scrollToBottom, wsHook]);

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
          <span className="chat-header__subtitle">Kenh van ban</span>
        </div>
      </div>

      <div className="chat-scroll" onScroll={handleScroll}>
        {isLoading && <div className="chat-status">Dang tai tin nhan...</div>}
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
          <span>{typingUsers.map((user) => user.name).join(', ')} dang go...</span>
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
