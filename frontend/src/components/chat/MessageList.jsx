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
    
    // 日付ごとにメッセージを時系列順にソート
    Object.keys(groups).forEach(date => {
      groups[date].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    });
    
    return groups;
  };

  const messageGroups = groupMessagesByDate();

  // 日付グループも古い順に表示する
  const renderMessageGroups = () => {
    const groups = groupMessagesByDate();
    const sortedDates = Object.keys(groups).sort((a, b) => new Date(a) - new Date(b));
    
    return sortedDates.map(date => (
      <div key={date} className="message-date-group">
        <div className="date-divider">
          <span className="date-label">{date}</span>
        </div>
        
        {groups[date].map(message => (
          <Message
            key={message._id}
            message={message}
            onOpenThread={onOpenThread}
            onUpdate={onUpdateMessage}
            onDelete={onDeleteMessage}
          />
        ))}
      </div>
    ));
  };

  // レンダリング部分の変更例
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
      
      {renderMessageGroups()}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;