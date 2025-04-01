import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../contexts/AppContext';
import api from '../../utils/api';
import Message from './Message';
import MessageInput from './MessageInput';

const ThreadView = ({ messageId, onClose, onMessageUpdate }) => {
  const { socket } = useApp();
  
  const [parentMessage, setParentMessage] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [channelInfo, setChannelInfo] = useState(null);
  
  const threadEndRef = useRef(null);

  // スレッド情報の取得
  useEffect(() => {
    const fetchThread = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/messages/thread/${messageId}`);
        
        setParentMessage(response.data.parentMessage);
        setReplies(response.data.replies);
        setChannelInfo(response.data.parentMessage.channel);
      } catch (err) {
        console.error('スレッド取得エラー:', err);
        setError('スレッドの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    if (messageId) {
      fetchThread();
    }
  }, [messageId]);

  // WebSocketでのリアルタイム更新
  useEffect(() => {
    if (!socket || !messageId) return;

    // 新しいスレッド返信
    const handleNewReply = (message) => {
      if (message.thread === messageId) {
        setReplies(prev => [...prev, message]);
        scrollToBottom();
      }
    };

    // メッセージ更新
    const handleMessageUpdate = (message) => {
      if (message._id === messageId) {
        setParentMessage(message);
        if (onMessageUpdate) {
          onMessageUpdate(message);
        }
      } else if (message.thread === messageId) {
        setReplies(prev =>
          prev.map(reply => (reply._id === message._id ? message : reply))
        );
      }
    };

    // メッセージ削除
    const handleMessageDelete = ({ id }) => {
      if (id === messageId) {
        onClose();
      } else if (parentMessage && parentMessage.thread === messageId) {
        setReplies(prev => prev.filter(reply => reply._id !== id));
      }
    };

    socket.on('newMessage', handleNewReply);
    socket.on('messageUpdated', handleMessageUpdate);
    socket.on('messageDeleted', handleMessageDelete);

    return () => {
      socket.off('newMessage', handleNewReply);
      socket.off('messageUpdated', handleMessageUpdate);
      socket.off('messageDeleted', handleMessageDelete);
    };
  }, [socket, messageId, parentMessage, onMessageUpdate, onClose]);

  // 新しい返信があったら下にスクロール
  const scrollToBottom = () => {
    if (threadEndRef.current) {
      threadEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 新しい返信が送信された時の処理
  const handleReplySent = (newReply) => {
    setReplies(prev => [...prev, newReply]);
    scrollToBottom();
  };

  // 返信の更新処理
  const handleReplyUpdate = (updatedReply) => {
    setReplies(prev =>
      prev.map(reply => (reply._id === updatedReply._id ? updatedReply : reply))
    );
  };

  // 返信の削除処理
  const handleReplyDelete = (replyId) => {
    setReplies(prev => prev.filter(reply => reply._id !== replyId));
  };

  // 親メッセージの更新処理
  const handleParentUpdate = (updatedMessage) => {
    setParentMessage(updatedMessage);
    if (onMessageUpdate) {
      onMessageUpdate(updatedMessage);
    }
  };

  if (loading) {
    return (
      <div className="thread-view">
        <div className="thread-header">
          <h3 className="thread-title">スレッド</h3>
          <button className="close-thread" onClick={onClose}>×</button>
        </div>
        <div className="thread-loading">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="thread-view">
        <div className="thread-header">
          <h3 className="thread-title">スレッド</h3>
          <button className="close-thread" onClick={onClose}>×</button>
        </div>
        <div className="thread-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="thread-view">
      <div className="thread-header">
        <h3 className="thread-title">スレッド</h3>
        <div className="thread-channel-info">
          {channelInfo && <span>#{channelInfo.name}</span>}
        </div>
        <button className="close-thread" onClick={onClose}>×</button>
      </div>
      
      <div className="thread-messages">
        {parentMessage && (
          <div className="parent-message">
            <Message
              message={parentMessage}
              onUpdate={handleParentUpdate}
              onDelete={onClose}
            />
          </div>
        )}
        
        {replies.length > 0 ? (
          <div className="thread-replies">
            <div className="replies-count">{replies.length}件の返信</div>
            
            {replies.map(reply => (
              <Message
                key={reply._id}
                message={reply}
                isThreadReply={true}
                onUpdate={handleReplyUpdate}
                onDelete={handleReplyDelete}
              />
            ))}
          </div>
        ) : (
          <div className="no-replies">
            このスレッドにはまだ返信がありません。
          </div>
        )}
        
        <div ref={threadEndRef} />
      </div>
      
      <div className="thread-input">
        <MessageInput
          channelId={parentMessage?.channel?._id}
          threadId={messageId}
          onMessageSent={handleReplySent}
        />
      </div>
    </div>
  );
};

export default ThreadView;