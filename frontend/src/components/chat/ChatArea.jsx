import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import api from '../../utils/api';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ThreadView from './ThreadView';

const ChatArea = ({ initialMessageId, isChannelFetched = false }) => {
  const { channelId } = useParams();
  const { 
    joinChannel, 
    leaveChannel, 
    currentChannel, 
    setCurrentChannel 
  } = useApp();
  
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeThread, setActiveThread] = useState(initialMessageId || null);

  // チャンネル情報の取得 (親コンポーネントで取得済みの場合はスキップ)
  useEffect(() => {
    const fetchMessages = async () => {
      if (!channelId) return;
      
      setLoading(true);
      try {
        console.log('メッセージ取得開始: チャンネルID =', channelId);
        const response = await api.get(`/api/messages/channel/${channelId}`, {
          params: { page, limit: 50 }
        });
        
        const { messages: newMessages, pagination } = response.data;
        console.log('メッセージ取得成功', newMessages.length);
        
        // 古いメッセージから新しいメッセージの順に並べる
        const orderedMessages = [...newMessages].reverse();
        
        if (page === 1) {
          setMessages(orderedMessages);
        } else {
          // 追加の古いメッセージは前に追加
          setMessages(prev => [...orderedMessages, ...prev]);
        }
        
        setHasMore(page < pagination.pages);
      } catch (err) {
        console.error('メッセージ取得エラー:', err);
        setError('メッセージの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };
  
    if (currentChannel) {
      fetchMessages();
    }
  }, [channelId, page, currentChannel]);

  // メッセージの取得
  useEffect(() => {
    const fetchMessages = async () => {
      if (!channelId) return;
      
      setLoading(true);
      try {
        console.log('メッセージ取得開始: チャンネルID =', channelId); // デバッグ用
        const response = await api.get(`/api/messages/channel/${channelId}`, {
          params: { page, limit: 50 }
        });
        
        const { messages: newMessages, pagination } = response.data;
        console.log('メッセージ取得成功', newMessages.length); // デバッグ用
        
        if (page === 1) {
          setMessages(newMessages);
        } else {
          setMessages(prev => [...prev, ...newMessages]);
        }
        
        setHasMore(page < pagination.pages);
      } catch (err) {
        console.error('メッセージ取得エラー:', err);
        setError('メッセージの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    if (currentChannel) {
      fetchMessages();
    }
  }, [channelId, page, currentChannel]);

  // 新しいメッセージの追加
  const handleNewMessage = (message) => {
    setMessages(prev => [...prev, message]);
  };

  // メッセージの更新
  const handleUpdateMessage = (updatedMessage) => {
    setMessages(prev =>
      prev.map(msg => 
        msg._id === updatedMessage._id ? updatedMessage : msg
      )
    );
  };

  // メッセージの削除
  const handleDeleteMessage = (messageId) => {
    setMessages(prev => prev.filter(msg => msg._id !== messageId));
  };

  // スレッドを開く
  const handleOpenThread = (messageId) => {
    setActiveThread(messageId);
  };

  // スレッドを閉じる
  const handleCloseThread = () => {
    setActiveThread(null);
  };

  // さらに読み込む
  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  };

  if (!currentChannel) {
    return <div className="loading">チャンネル情報を読み込んでいます...</div>;
  }

  return (
    <div className="chat-area">
      <div className={`messages-container ${activeThread ? 'with-thread' : ''}`}>
        <MessageList
          messages={messages}
          loading={loading}
          error={error}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          onOpenThread={handleOpenThread}
          onUpdateMessage={handleUpdateMessage}
          onDeleteMessage={handleDeleteMessage}
        />
        <MessageInput
          channelId={channelId}
          onMessageSent={handleNewMessage}
        />
      </div>

      {activeThread && (
        <ThreadView
          messageId={activeThread}
          onClose={handleCloseThread}
          onMessageUpdate={handleUpdateMessage}
        />
      )}
    </div>
  );
};

export default ChatArea;