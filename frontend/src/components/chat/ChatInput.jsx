import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import api from '../../api/axiosConfig';
import useServerStore from '../../store/useServerStore';
import useUserStore from '../../store/useUserStore';
import {
  buildMemberDirectory,
  createDisplayNameResolver,
  findMentionMatch,
  insertMentionToken,
  parseMentionParts,
} from '../../utils/mentionUtils';

/**
 * ChatInput: textarea, file upload, typing indicator
 */
const ChatInput = ({ wsHook, scrollToBottom }) => {
  const { currentChannel, currentServer } = useServerStore();
  const { currentUser } = useUserStore();

  const [content, setContent] = useState('');
  const [preview, setPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [caretPosition, setCaretPosition] = useState(0);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const [suppressMentionMenu, setSuppressMentionMenu] = useState(false);

  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const textareaRef = useRef(null);
  const overlayRef = useRef(null);

  const memberDirectory = useMemo(
    () => buildMemberDirectory(currentServer?.members || [], currentUser),
    [currentServer?.members, currentUser]
  );
  const resolveDisplayName = useMemo(
    () => createDisplayNameResolver(memberDirectory),
    [memberDirectory]
  );

  const mentionCandidates = useMemo(() => {
    const mentionMatch = findMentionMatch(content, caretPosition);
    if (!mentionMatch) {
      return [];
    }

    const query = mentionMatch.query.trim().toLowerCase();

    return (currentServer?.members || [])
      .filter((member) => member?.userId && member.userId !== currentUser?.id)
      .filter((member) => {
        if (!query) {
          return true;
        }

        const name = (member.displayName || '').toLowerCase();
        return name.includes(query) || member.userId.toLowerCase().includes(query);
      })
      .sort((left, right) => {
        const leftName = (left.displayName || '').toLowerCase();
        const rightName = (right.displayName || '').toLowerCase();
        const leftStartsWith = query ? leftName.startsWith(query) : true;
        const rightStartsWith = query ? rightName.startsWith(query) : true;

        if (leftStartsWith !== rightStartsWith) {
          return leftStartsWith ? -1 : 1;
        }

        return leftName.localeCompare(rightName);
      })
      .slice(0, 6);
  }, [content, caretPosition, currentServer?.members, currentUser?.id]);

  const activeMentionMatch = useMemo(
    () => findMentionMatch(content, caretPosition),
    [content, caretPosition]
  );
  const isMentionMenuOpen = !preview && !suppressMentionMenu && !!activeMentionMatch && mentionCandidates.length > 0;

  const syncOverlayScroll = useCallback(() => {
    if (overlayRef.current && textareaRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  const syncComposerHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = '0px';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    syncOverlayScroll();
  }, [syncOverlayScroll]);

  useEffect(() => {
    syncComposerHeight();
  }, [content, syncComposerHeight]);

  useEffect(() => {
    setActiveSuggestionIndex(0);
  }, [activeMentionMatch?.query, currentServer?.id]);

  useEffect(() => {
    setSuppressMentionMenu(false);
  }, [content, caretPosition]);

  const sendTyping = useCallback(() => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    wsHook?.publish(`/app/chat/${currentChannel.id}/typing`, {});
    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = null;
    }, 1000);
  }, [wsHook, currentChannel?.id]);

  const focusComposer = useCallback((nextCaretPosition) => {
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) {
        return;
      }

      textarea.focus();
      textarea.setSelectionRange(nextCaretPosition, nextCaretPosition);
      setCaretPosition(nextCaretPosition);
      syncComposerHeight();
    });
  }, [syncComposerHeight]);

  const handleSelectMention = useCallback((member) => {
    if (!member?.userId || !activeMentionMatch) {
      return;
    }

    const nextValue = insertMentionToken(content, activeMentionMatch, member.userId);
    setContent(nextValue.content);
    setActiveSuggestionIndex(0);
    setSuppressMentionMenu(false);
    focusComposer(nextValue.caretPosition);
    sendTyping();
  }, [activeMentionMatch, content, focusComposer, sendTyping]);

  const handleSend = async () => {
    if (!currentChannel || !currentUser) return;

    if (preview) {
      await sendFile();
      return;
    }

    const nextContent = content.trim();
    if (!nextContent) return;

    wsHook?.publish(`/app/chat/${currentChannel.id}`, {
      type: 'SEND',
      channelId: currentChannel.id,
      content: nextContent,
      senderId: currentUser.id,
      messageType: 'TEXT',
    });

    setContent('');
    setCaretPosition(0);
    scrollToBottom?.();
  };

  const handleKeyDown = (e) => {
    if (isMentionMenuOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestionIndex((prev) => (prev + 1) % mentionCandidates.length);
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestionIndex((prev) => (prev - 1 + mentionCandidates.length) % mentionCandidates.length);
        return;
      }

      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        handleSelectMention(mentionCandidates[activeSuggestionIndex]);
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setActiveSuggestionIndex(0);
        setSuppressMentionMenu(true);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const isImage = file.type.startsWith('image/');
    const previewUrl = isImage ? URL.createObjectURL(file) : null;
    setPreview({ file, previewUrl, isImage });
  };

  const sendFile = async () => {
    if (!preview || !currentChannel) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', preview.file);
      formData.append('channelId', currentChannel.id);

      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { fileUrl, fileName, fileType } = res.data;

      wsHook?.publish(`/app/chat/${currentChannel.id}`, {
        type: 'SEND',
        channelId: currentChannel.id,
        content: fileName,
        senderId: currentUser.id,
        fileUrl,
        fileName,
        messageType: fileType,
      });

      if (preview.previewUrl) {
        URL.revokeObjectURL(preview.previewUrl);
      }
      setPreview(null);
      scrollToBottom?.();
    } catch (e) {
      console.error('Loi upload file:', e);
      alert('Upload that bai: ' + (e.response?.data?.error || e.message));
    } finally {
      setIsUploading(false);
    }
  };

  const cancelPreview = () => {
    if (preview?.previewUrl) URL.revokeObjectURL(preview.previewUrl);
    setPreview(null);
  };

  const handleContentChange = (event) => {
    setContent(event.target.value);
    setCaretPosition(event.target.selectionStart || 0);
    sendTyping();
  };

  const updateCaretPosition = (event) => {
    setCaretPosition(event.target.selectionStart || 0);
  };

  const renderComposerContent = () => {
    const parts = parseMentionParts(content);

    if (!parts.length) {
      return (
        <span className="chat-input-overlay__placeholder">
          {`Nhan ${currentChannel ? `#${currentChannel.name}` : ''}...`}
        </span>
      );
    }

    return parts.map((part, index) => {
      if (part.type === 'mention') {
        return (
          <span key={`mention-${part.userId}-${index}`} className="mention-chip mention-chip--composer">
            @{resolveDisplayName(part.userId)}
          </span>
        );
      }

      return <React.Fragment key={`text-${index}`}>{part.value}</React.Fragment>;
    });
  };

  return (
    <div className="chat-composer-shell">
      {preview && (
        <div className="chat-preview-card">
          {preview.isImage ? (
            <img src={preview.previewUrl} alt="" className="chat-preview-card__image" />
          ) : (
            <div className="chat-preview-card__file">
              <span className="chat-preview-card__file-icon">
                <FileIcon />
              </span>
              <span>{preview.file.name}</span>
            </div>
          )}
          <button
            type="button"
            onClick={cancelPreview}
            className="chat-preview-card__remove"
            aria-label="Xoa tep dinh kem"
          >
            <CloseIcon />
          </button>
        </div>
      )}

      <div className={`chat-composer ${preview ? 'has-preview' : ''}`}>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="chat-composer__action"
          title="Dinh kem file"
          disabled={isUploading}
        >
          <AttachIcon />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.zip,.txt,.docx"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />

        <div className="chat-composer__editor">
          <div ref={overlayRef} className="chat-input-overlay" aria-hidden="true">
            {renderComposerContent()}
          </div>

          <textarea
            ref={textareaRef}
            className="chat-input chat-input--ghost"
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            onSelect={updateCaretPosition}
            onClick={updateCaretPosition}
            onKeyUp={updateCaretPosition}
            onScroll={syncOverlayScroll}
            rows={1}
            disabled={!!preview}
            aria-label={`Nhan ${currentChannel ? `#${currentChannel.name}` : 'tin nhan'}`}
          />

          {isMentionMenuOpen && (
            <div className="composer-mention-menu animate-fade-in">
              {mentionCandidates.map((member, index) => (
                <button
                  type="button"
                  key={member.userId}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    handleSelectMention(member);
                  }}
                  className={`composer-mention-menu__item ${index === activeSuggestionIndex ? 'is-active' : ''}`}
                >
                  <img
                    src={member.avatarUrl || 'https://via.placeholder.com/32'}
                    alt={member.displayName}
                    className="avatar composer-mention-menu__avatar"
                  />
                  <span className="composer-mention-menu__meta">
                    <span className="composer-mention-menu__name">{member.displayName}</span>
                    <span className="composer-mention-menu__hint">@{member.userId}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleSend}
          disabled={(!content.trim() && !preview) || isUploading}
          className={`chat-composer__send ${content.trim() || preview ? 'is-active' : ''}`}
          title={isUploading ? 'Dang upload...' : 'Gui'}
        >
          {isUploading ? <SpinnerIcon /> : <SendIcon />}
        </button>
      </div>
    </div>
  );
};

const AttachIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m21.44 11.05-8.49 8.49a5.5 5.5 0 0 1-7.78-7.78l9.2-9.19a3.5 3.5 0 1 1 4.95 4.95l-9.19 9.2a1.5 1.5 0 0 1-2.12-2.13l8.49-8.48" />
  </svg>
);

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 2 11 13" />
    <path d="m22 2-7 20-4-9-9-4 20-7Z" />
  </svg>
);

const SpinnerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M21 12a9 9 0 1 1-2.64-6.36" />
  </svg>
);

const FileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
    <path d="M14 3v5h5" />
    <path d="M9 15h6" />
    <path d="M9 11h3" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="m6 6 12 12" />
    <path d="M18 6 6 18" />
  </svg>
);

export default ChatInput;
