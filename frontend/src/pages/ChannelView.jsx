import React, { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import ChatArea from '../components/chat/ChatArea';
import ChannelInfo from '../components/chat/ChannelInfo';

const ChannelView = () => {
  const { channelId } = useParams();
  const [searchParams] = useSearchParams();
  const messageId = searchParams.get('message');
  
  const {
    currentChannel,
    setCurrentChannel,
    joinChannel,
    leaveChannel,
    loading
  } = useApp();

  // チャンネル参加/退出
  useEffect(() => {
    if (channelId) {
      joinChannel(channelId);
    }
    
    return () => {
      if (channelId) {
        leaveChannel(channelId);
        setCurrentChannel(null);
      }
    };
  }, [channelId, joinChannel, leaveChannel, setCurrentChannel]);

  if (loading) {
    return <div className="loading">チャンネルを読み込んでいます...</div>;
  }

  return (
    <div className="channel-view">
      {currentChannel ? (
        <>
          <div className="channel-header">
            <ChannelInfo channel={currentChannel} />
          </div>
          
          <div className="channel-content">
            <ChatArea initialMessageId={messageId} />
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