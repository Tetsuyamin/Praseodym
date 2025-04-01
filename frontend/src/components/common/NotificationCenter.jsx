import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import Button from './Button';
import Avatar from './Avatar';

const NotificationCenter = () => {
  const { notifications, removeNotification } = useApp();
  const navigate = useNavigate();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // 未読通知のカウント
  useEffect(() => {
    setUnreadCount(notifications.length);
  }, [notifications]);

  // 通知をクリックして該当ページに移動
  const handleNotificationClick = (notification) => {
    removeNotification(notification.id);
    
    if (notification.type === 'message' || notification.type === 'mention') {
      navigate(`/channel/${notification.channel}?message=${notification.id}`);
    } else if (notification.type === 'comment') {
      navigate(`/document/${notification.spaceKey}/${notification.pageId}?comment=${notification.id}`);
    }
    
    setIsExpanded(false);
  };

  // すべての通知を既読にする
  const markAllAsRead = () => {
    notifications.forEach(notification => {
      removeNotification(notification.id);
    });
  };

  // 個別の通知を削除
  const handleRemoveNotification = (e, id) => {
    e.stopPropagation();
    removeNotification(id);
  };

  // 通知内容の表示フォーマット
  const getNotificationContent = (notification) => {
    if (notification.type === 'message') {
      return `新規メッセージ: ${notification.content}`;
    } else if (notification.type === 'mention') {
      return `メンション: ${notification.content}`;
    } else if (notification.type === 'comment') {
      return `コメント: ${notification.content}`;
    }
    return notification.content;
  };

  // 通知時間の表示フォーマット
  const getTimeString = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffMs = now - notificationTime;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay > 0) {
      return `${diffDay}日前`;
    } else if (diffHour > 0) {
      return `${diffHour}時間前`;
    } else if (diffMin > 0) {
      return `${diffMin}分前`;
    } else {
      return '今すぐ';
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className={`notification-center ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {!isExpanded ? (
        <div 
          className="notification-badge"
          onClick={() => setIsExpanded(true)}
        >
          <span className="notification-icon">🔔</span>
          {unreadCount > 0 && (
            <span className="unread-count">{unreadCount}</span>
          )}
        </div>
      ) : (
        <div className="notification-panel">
          <div className="notification-header">
            <h3>通知</h3>
            <div className="notification-actions">
              <Button 
                variant="link" 
                size="sm" 
                onClick={markAllAsRead}
              >
                すべて既読にする
              </Button>
              <button
                className="close-panel"
                onClick={() => setIsExpanded(false)}
              >
                ×
              </button>
            </div>
          </div>
          
          <div className="notification-list">
            {notifications.length > 0 ? (
              <ul>
                {notifications.map(notification => (
                  <li 
                    key={notification.id}
                    className={`notification-item ${notification.type}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-avatar">
                      <Avatar user={notification.sender} size="sm" />
                    </div>
                    
                    <div className="notification-content">
                      <div className="notification-text">
                        {getNotificationContent(notification)}
                      </div>
                      
                      <div className="notification-meta">
                        <span className="notification-time">
                          {getTimeString(notification.createdAt)}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      className="remove-notification"
                      onClick={(e) => handleRemoveNotification(e, notification.id)}
                      title="削除"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="no-notifications">
                通知はありません
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;