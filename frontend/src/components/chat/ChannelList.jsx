import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';

const ChannelList = () => {
  const location = useLocation();
  const { channels } = useApp();
  const [filter, setFilter] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // チャンネルをフィルタリング
  const filteredChannels = channels
    .filter(channel => {
      // アーカイブされたチャンネルを表示するかどうか
      if (!showArchived && channel.isArchived) {
        return false;
      }
      
      // フィルター文字列でフィルタリング
      if (filter) {
        return channel.name.toLowerCase().includes(filter.toLowerCase());
      }
      
      return true;
    })
    .sort((a, b) => {
      // ピン留めされたチャンネルを上部に表示
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      // 未読のチャンネルを優先
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
      
      // それ以外は更新順
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

  // 現在のチャンネルがアクティブかどうかを判定
  const isActiveChannel = (channelId) => {
    return location.pathname === `/channel/${channelId}`;
  };

  return (
    <div className="channel-list">
      {channels.length > 5 && (
        <div className="channel-filter">
          <input
            type="text"
            className="filter-input"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="チャンネルを検索..."
          />
        </div>
      )}
      
      <ul className="channel-items">
        {filteredChannels.length > 0 ? (
          filteredChannels.map(channel => (
            <li
              key={channel._id}
              className={`channel-item ${isActiveChannel(channel._id) ? 'active' : ''} ${
                channel.unreadCount > 0 ? 'unread' : ''
              } ${channel.isPrivate ? 'private' : ''}`}
            >
              <Link to={`/channel/${channel._id}`} className="channel-link">
                <span className="channel-icon">
                  {channel.isPrivate ? '🔒' : '#'}
                </span>
                <span className="channel-name">{channel.name}</span>
                {channel.unreadCount > 0 && (
                  <span className="unread-badge">{channel.unreadCount}</span>
                )}
              </Link>
            </li>
          ))
        ) : (
          <li className="no-channels">
            {filter ? '一致するチャンネルがありません' : 'チャンネルがありません'}
          </li>
        )}
      </ul>
      
      {channels.some(channel => channel.isArchived) && (
        <div className="archived-toggle">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={() => setShowArchived(!showArchived)}
            />
            アーカイブされたチャンネルを表示
          </label>
        </div>
      )}
    </div>
  );
};

export default ChannelList;