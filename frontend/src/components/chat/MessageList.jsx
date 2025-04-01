import React, { useRef, useEffect } from 'react';
import Message from './Message';

const MessageList = ({
  messages,
  loading,
  error,
  hasMore,
  onLoadMore,
  onOpenThread,
  onUpdateMessage,
  onDeleteMessage
}) => {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // スクロール検出
  useEffect(() => {
    const handleScroll = () => {
      const { scrollTop } = messagesContainerRef.current;
      
      // 上部までスクロールしたらさらに読み込む
      if (scrollTop < 100 && hasMore && !loading) {
        onLoadMore();
      }
    };

    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [hasMore, loading, onLoadMore]);

  // 新しいメッセージが追加されたら一番下までスクロール
  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // メッセージの日付ごとのグループ化
  const groupMessagesByDate = () => {
    const groups = {};
    
    messages.forEach(message => {
      const date = new Date(message.createdAt).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };

  const messageGroups = groupMessagesByDate();

  return (
    <div className="message-list" ref={messagesContainerRef}>
      {loading && messages.length === 0 && (
        <div className="loading-messages">メッセージを読み込んでいます...</div>
      )}
      
      {error && (
        <div className="error-message">{error}</div>
      )}
      
      {hasMore && (
        <div className="load-more-messages">
          <button onClick={onLoadMore} disabled={loading}>
            {loading ? '読み込み中...' : '過去のメッセージを読み込む'}
          </button>
        </div>
      )}
      
      {Object.entries(messageGroups).map(([date, messagesGroup]) => (
        <div key={date} className="message-date-group">
          <div className="date-divider">
            <span className="date-label">{date}</span>
          </div>
          
          {messagesGroup.map(message => (
            <Message
              key={message._id}
              message={message}
              onOpenThread={onOpenThread}
              onUpdate={onUpdateMessage}
              onDelete={onDeleteMessage}
            />
          ))}
        </div>
      ))}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;