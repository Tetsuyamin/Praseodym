import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import EmojiPicker from '../common/EmojiPicker';
import FileUpload from '../common/FileUpload';

const MessageInput = ({ channelId, threadId = null, onMessageSent }) => {
  const { sendMessage, socket } = useApp();
  
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // フォーカス時にキーボードショートカットを設定
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Escキーでエモジピッカーを閉じる
      if (e.key === 'Escape') {
        setShowEmojiPicker(false);
        setShowFileUpload(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // タイピング通知
  useEffect(() => {
    if (!socket || !channelId) return;

    // タイピング終了の通知
    const notifyStoppedTyping = () => {
      socket.emit('typing', {
        channelId,
        isTyping: false
      });
      setIsTyping(false);
    };

    // メッセージが入力されている場合
    if (message.trim().length > 0) {
      // まだタイピング通知を送っていなければ送信
      if (!isTyping) {
        socket.emit('typing', {
          channelId,
          isTyping: true
        });
        setIsTyping(true);
      }
      
      // タイピング終了のタイマーをリセット
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // 2秒間入力がなければタイピング終了と判断
      typingTimeoutRef.current = setTimeout(notifyStoppedTyping, 2000);
    } else {
      notifyStoppedTyping();
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, isTyping, socket, channelId]);

  // メッセージの送信
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (message.trim() === '' && attachments.length === 0) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // タイピング終了を通知
      if (socket && isTyping) {
        socket.emit('typing', {
          channelId,
          isTyping: false
        });
        setIsTyping(false);
      }

      const sentMessage = await sendMessage(
        message.trim(), 
        channelId, 
        threadId, 
        attachments
      );
      
      // 送信完了後、入力フィールドをクリア
      setMessage('');
      setAttachments([]);
      setShowEmojiPicker(false);
      setShowFileUpload(false);
      
      // 親コンポーネントに通知
      if (onMessageSent) {
        onMessageSent(sentMessage);
      }
      
      // 入力フィールドにフォーカスを戻す
      inputRef.current.focus();
    } catch (err) {
      console.error('メッセージ送信エラー:', err);
      alert('メッセージの送信に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // エモジの追加
  const handleEmojiSelect = (emoji) => {
    setMessage(prev => prev + emoji.native);
    setShowEmojiPicker(false);
    inputRef.current.focus();
  };

  // ファイルの追加
  const handleFileSelect = (files) => {
    setAttachments(prev => [...prev, ...files]);
    setShowFileUpload(false);
  };

  // 添付ファイルの削除
  const handleRemoveAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="message-input-container">
      {attachments.length > 0 && (
        <div className="attachments-preview">
          {attachments.map((file, index) => (
            <div key={index} className="attachment-item">
              <span className="attachment-name">{file.name}</span>
              <button
                className="remove-attachment"
                onClick={() => handleRemoveAttachment(index)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      
      <form className="message-form" onSubmit={handleSubmit}>
        <div className="message-toolbar">
          <button
            type="button"
            className="toolbar-button"
            onClick={() => {
              setShowFileUpload(!showFileUpload);
              setShowEmojiPicker(false);
            }}
            title="ファイルを添付"
          >
            <i className="icon-paperclip"></i>
          </button>
          
          <button
            type="button"
            className="toolbar-button"
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowFileUpload(false);
            }}
            title="絵文字を追加"
          >
            <i className="icon-smile"></i>
          </button>
        </div>
        
        <input
          type="text"
          ref={inputRef}
          className="message-input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={threadId ? "スレッドに返信する..." : "メッセージを入力..."}
          disabled={isSubmitting}
        />
        
        <button 
          type="submit" 
          className="send-button" 
          disabled={isSubmitting || (message.trim() === '' && attachments.length === 0)}
        >
          {isSubmitting ? '送信中...' : '送信'}
        </button>
      </form>
      
      {showEmojiPicker && (
        <div className="emoji-picker-container">
          <EmojiPicker onSelect={handleEmojiSelect} />
        </div>
      )}
      
      {showFileUpload && (
        <div className="file-upload-container">
          <FileUpload onSelect={handleFileSelect} />
        </div>
      )}
    </div>
  );
};

export default MessageInput;