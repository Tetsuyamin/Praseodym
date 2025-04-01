import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import Avatar from '../common/Avatar';
import EmojiPicker from '../common/EmojiPicker';
import { timeAgo, linkifyText } from '../../utils/helpers';
import api from '../../utils/api';

const Message = ({
  message,
  isThreadReply = false,
  onOpenThread,
  onUpdate,
  onDelete
}) => {
  const { user } = useAuth();
  const { socket } = useApp();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const messageRef = useRef(null);
  const textareaRef = useRef(null);

  // メッセージ編集の保存
  const handleSaveEdit = async () => {
    if (editContent.trim() === message.content) {
      setIsEditing(false);
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const response = await api.put(`/api/messages/${message._id}`, {
        content: editContent
      });
      
      onUpdate(response.data);
      setIsEditing(false);
    } catch (err) {
      console.error('メッセージ更新エラー:', err);
      alert('メッセージの更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // メッセージ削除
  const handleDelete = async () => {
    if (!window.confirm('このメッセージを削除しますか？\n削除すると元に戻せません。')) {
      return;
    }
    
    try {
      await api.delete(`/api/messages/${message._id}`);
      onDelete(message._id);
    } catch (err) {
      console.error('メッセージ削除エラー:', err);
      alert('メッセージの削除に失敗しました');
    }
  };

  // リアクション追加
  const handleAddReaction = async (emoji) => {
    try {
      // 絵文字オブジェクトの形式を正規化
      const emojiValue = typeof emoji === 'string' 
        ? emoji 
        : (emoji.native || emoji);
      
      const response = await api.post(`/api/messages/${message._id}/reactions`, {
        emoji: emojiValue
      });
      
      onUpdate(response.data);
      setShowEmojiPicker(false);
    } catch (err) {
      console.error('リアクション追加エラー:', err);
      alert('リアクションの追加に失敗しました');
    }
  };

  // エスケープキーで編集キャンセル
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditContent(message.content);
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    }
  };

  // 自動リサイズ
  const autoResize = (textarea) => {
    if (!textarea) return;
    
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  // 編集モード開始時にフォーカスとリサイズ
  React.useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      autoResize(textareaRef.current);
      
      // カーソルを末尾に移動
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);
    }
  }, [isEditing]);

  // メッセージ内容表示（HTMLリンク対応）
  const renderMessageContent = () => {
    return (
      <div
        className="message-text"
        dangerouslySetInnerHTML={{ __html: linkifyText(message.content) }}
      />
    );
  };

  // スレッドへの返信数表示
  const renderThreadInfo = () => {
    if (isThreadReply || !message.threadCount) return null;
    
    return (
      <div
        className="thread-info"
        onClick={() => onOpenThread(message._id)}
      >
        <span className="thread-icon">💬</span>
        <span className="thread-count">
          {message.threadCount}件の返信
        </span>
      </div>
    );
  };

  // リアクション表示
  const renderReactions = () => {
    if (!message.reactions || message.reactions.length === 0) return null;
    
    return (
      <div className="message-reactions">
        {message.reactions.map((reaction, index) => {
          const hasReacted = reaction.users.some(
            u => u._id === user.id
          );
          
          return (
            <button
              key={`${reaction.emoji}-${index}`}
              className={`reaction-button ${hasReacted ? 'has-reacted' : ''}`}
              onClick={() => handleAddReaction({ native: reaction.emoji })}
            >
              <span className="reaction-emoji">{reaction.emoji}</span>
              <span className="reaction-count">{reaction.users.length}</span>
            </button>
          );
        })}
      </div>
    );
  };

  // 添付ファイル表示
  const renderAttachments = () => {
    if (!message.attachments || message.attachments.length === 0) return null;
    
    return (
      <div className="message-attachments">
        {message.attachments.map((attachment, index) => {
          // 画像の場合
          if (attachment.type.startsWith('image/')) {
            return (
              <div key={index} className="attachment-image">
                <img src={attachment.url} alt={attachment.name} />
              </div>
            );
          }
          
          // ファイルの場合
          return (
            <div key={index} className="attachment-file">
              <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                <span className="file-icon">📎</span>
                <span className="file-name">{attachment.name}</span>
              </a>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      ref={messageRef}
      className={`message ${isThreadReply ? 'thread-reply' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="message-avatar">
        <Avatar user={message.sender} size={isThreadReply ? 'xs' : 'sm'} />
      </div>
      
      <div className="message-content">
        <div className="message-header">
          <span className="sender-name">{message.sender.displayName}</span>
          <span className="message-time" title={new Date(message.createdAt).toLocaleString()}>
            {timeAgo(message.createdAt)}
          </span>
          
          {message.isEdited && (
            <span className="edited-tag" title={`編集: ${new Date(message.updatedAt).toLocaleString()}`}>
              (編集済み)
            </span>
          )}
        </div>
        
        {isEditing ? (
          <div className="message-edit">
            <textarea
              ref={textareaRef}
              className="edit-textarea"
              value={editContent}
              onChange={(e) => {
                setEditContent(e.target.value);
                autoResize(e.target);
              }}
              onKeyDown={handleKeyDown}
              disabled={isSubmitting}
            />
            
            <div className="edit-actions">
              <button
                className="cancel-edit"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(message.content);
                }}
                disabled={isSubmitting}
              >
                キャンセル
              </button>
              
              <button
                className="save-edit"
                onClick={handleSaveEdit}
                disabled={isSubmitting || editContent.trim() === ''}
              >
                {isSubmitting ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {renderMessageContent()}
            {renderAttachments()}
            {renderReactions()}
            {renderThreadInfo()}
            
            {showActions && message.sender._id === user.id && (
              <div className="message-actions">
                <button
                  className="action-button"
                  onClick={() => setIsEditing(true)}
                  title="編集"
                >
                  <span className="action-icon">✏️</span>
                </button>
                
                <button
                  className="action-button"
                  onClick={handleDelete}
                  title="削除"
                >
                  <span className="action-icon">🗑️</span>
                </button>
              </div>
            )}
            
            {showActions && (
              <div className="message-quick-actions">
                <button
                  className="quick-action-button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  title="リアクション"
                >
                  <span className="action-icon">😀</span>
                </button>
                
                {!isThreadReply && (
                  <button
                    className="quick-action-button"
                    onClick={() => onOpenThread(message._id)}
                    title="スレッドで返信"
                  >
                    <span className="action-icon">💬</span>
                  </button>
                )}
              </div>
            )}
            
            {showEmojiPicker && (
              <div className="emoji-picker-container">
                <EmojiPicker onSelect={handleAddReaction} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Message;