import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import ChatArea from '../components/chat/ChatArea';
import ChannelInfo from '../components/chat/ChannelInfo';
import api from '../utils/api'; // apiをインポート

const ChannelView = () => {
  const { channelId } = useParams();
  const [searchParams] = useSearchParams();
  const messageId = searchParams.get('message');
  
  const {
    currentChannel,
    setCurrentChannel,
    joinChannel,
    leaveChannel,
    loading: appLoading
  } = useApp();
  
  // ローカルのローディング状態を追加
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // チャンネル情報を直接ここで取得
  useEffect(() => {
    const fetchChannel = async () => {
      if (!channelId) return;
      
      try {
        setLoading(true);
        const response = await api.get(`/api/channels/${channelId}`);
        console.log('チャンネル取得成功:', response.data); // デバッグ用
        setCurrentChannel(response.data);
      } catch (err) {
        console.error('チャンネル取得エラー:', err);
        setError('チャンネルの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchChannel();
    
    // クリーンアップ
    return () => {
      // コンポーネントのアンマウント時にチャンネルをリセット
      setCurrentChannel(null);
    };
  }, [channelId, setCurrentChannel]);

  // チャンネル参加/退出
  useEffect(() => {
    if (channelId) {
      joinChannel(channelId);
    }
    
    return () => {
      if (channelId) {
        leaveChannel(channelId);
      }
    };
  }, [channelId, joinChannel, leaveChannel]);

  // ChatAreaコンポーネントでの二重取得を防ぐために修正済みかのフラグを渡す
  const isChannelFetched = !!currentChannel;
  
  if (loading || appLoading) {
    return <div className="loading">チャンネルを読み込んでいます...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="channel-view">
      {currentChannel ? (
        <>
          <div className="channel-header">
            <ChannelInfo channel={currentChannel} />
          </div>
          
          <div className="channel-content">
            <ChatArea 
              initialMessageId={messageId} 
              isChannelFetched={isChannelFetched} 
            />
          </div>
        </>
      ) : (
        <div className="channel-not-found">
          <h2>チャンネルが見つかりません</h2>
          <p>
            このチャンネルは存在しないか、アクセス権限がありません。
          </p>
        </div>
      )}
    </div>
  );
};

export default ChannelView;