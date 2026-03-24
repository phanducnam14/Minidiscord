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
  const [preview, setPreview] = useState(null); // { file, previewUrl }
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Gửi TYPING event (debounce 1000ms)
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

    // Nếu có file preview → upload trước
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
        messageType: fileType, // IMAGE hoặc FILE
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
    <div style={{ padding: '0 16px 16px', flexShrink: 0 }}>
      {/* File preview */}
      {preview && (
        <div style={{
          background: 'var(--discord-input-bg)',
          borderRadius: '8px 8px 0 0',
          padding: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderBottom: '1px solid var(--discord-divider)',
        }}>
          {preview.isImage ? (
            <img src={preview.previewUrl} alt="" style={{ maxWidth: 160, maxHeight: 100, borderRadius: 4, objectFit: 'contain' }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--discord-text-secondary)' }}>
              <span style={{ fontSize: 24 }}>📄</span>
              <span style={{ fontSize: 14 }}>{preview.file.name}</span>
            </div>
          )}
          <button
            onClick={cancelPreview}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--discord-red)', fontSize: 20, cursor: 'pointer' }}
          >×</button>
        </div>
      )}

      {/* Input area */}
      <div style={{
        background: 'var(--discord-input-bg)',
        borderRadius: preview ? '0 0 8px 8px' : 8,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 8px',
      }}>
        {/* File upload button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '4px 8px', transition: 'transform 0.1s',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          title="Đính kèm file"
          disabled={isUploading}
        >
          <div style={{
            width: 24, height: 24, borderRadius: '50%', background: 'var(--discord-text-muted)',
            color: 'var(--discord-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 700, paddingBottom: 2
          }}>+</div>
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
          style={{ borderRadius: 0, padding: '8px 0' }}
          disabled={!!preview}
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={(!content.trim() && !preview) || isUploading}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: (!content.trim() && !preview) ? 'var(--discord-text-muted)' : 'var(--discord-accent)',
            fontSize: 22, padding: '4px 8px', borderRadius: 4, transition: 'color 0.1s',
          }}
          title={isUploading ? 'Đang upload...' : 'Gửi'}
        >
          {isUploading ? '⏳' : '➤'}
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
