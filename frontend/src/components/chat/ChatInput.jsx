import React, { useState, useRef, useCallback } from 'react';
import api from '../../api/axiosConfig';
import useServerStore from '../../store/useServerStore';
import useUserStore from '../../store/useUserStore';

/**
 * ChatInput: textarea, file upload, typing indicator
 */
const ChatInput = ({ wsHook, scrollToBottom }) => {
  const { currentChannel } = useServerStore();
  const { currentUser } = useUserStore();

  const [content, setContent] = useState('');
  const [preview, setPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const sendTyping = useCallback(() => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    wsHook?.publish(`/app/chat/${currentChannel.id}/typing`, {});
    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = null;
    }, 1000);
  }, [wsHook, currentChannel?.id]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    if (!currentChannel || !currentUser) return;

    if (preview) {
      await sendFile();
      return;
    }
    if (!content.trim()) return;

    wsHook?.publish(`/app/chat/${currentChannel.id}`, {
      type: 'SEND',
      channelId: currentChannel.id,
      content: content.trim(),
      senderId: currentUser.id,
      messageType: 'TEXT',
    });

    setContent('');
    scrollToBottom?.();
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

      setPreview(null);
      scrollToBottom?.();
    } catch (e) {
      console.error('Lỗi upload file:', e);
      alert('Upload thất bại: ' + (e.response?.data?.error || e.message));
    } finally {
      setIsUploading(false);
    }
  };

  const cancelPreview = () => {
    if (preview?.previewUrl) URL.revokeObjectURL(preview.previewUrl);
    setPreview(null);
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
            aria-label="Xóa tệp đính kèm"
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
          title="Đính kèm file"
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

        <textarea
          className="chat-input"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            sendTyping();
          }}
          onKeyDown={handleKeyDown}
          placeholder={`Nhắn ${currentChannel ? '#' + currentChannel.name : ''}...`}
          rows={1}
          disabled={!!preview}
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={(!content.trim() && !preview) || isUploading}
          className={`chat-composer__send ${content.trim() || preview ? 'is-active' : ''}`}
          title={isUploading ? 'Đang upload...' : 'Gửi'}
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
