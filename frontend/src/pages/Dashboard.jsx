import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import Button from '../components/common/Button';
import api from '../utils/api';

const Dashboard = () => {
  const { user } = useAuth();
  const { channels, spaces } = useApp();
  
  const [recentMessages, setRecentMessages] = useState([]);
  const [recentPages, setRecentPages] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 最近のメッセージ、ページ、アクティビティを取得
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // 最近のメッセージ
        const messagesResponse = await api.get('/api/messages/recent');
        setRecentMessages(messagesResponse.data);
        
        // 最近のページ
        const pagesResponse = await api.get('/api/pages/recent');
        setRecentPages(pagesResponse.data);
        
        // 最近のアクティビティ
        const activityResponse = await api.get('/api/activity');
        setRecentActivity(activityResponse.data);
      } catch (err) {
        console.error('ダッシュボードデータ取得エラー:', err);
        setError('データの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // チャンネル名の取得
  const getChannelName = (channelId) => {
    const channel = channels.find(c => c._id === channelId);
    return channel ? channel.name : 'Unknown Channel';
  };

  // スペース名の取得
  const getSpaceName = (spaceId) => {
    const space = spaces.find(s => s._id === spaceId);
    return space ? space.name : 'Unknown Space';
  };

  // アクティビティのアイコン表示
  const getActivityIcon = (type) => {
    switch (type) {
      case 'message':
        return '💬';
      case 'page_create':
        return '📝';
      case 'page_update':
        return '📄';
      case 'channel_create':
        return '#️⃣';
      case 'space_create':
        return '📚';
      default:
        return '➡️';
    }
  };

  // アクティビティの説明表示
  const getActivityDescription = (activity) => {
    const { type, user, data } = activity;
    
    switch (type) {
      case 'message':
        return `${user.displayName} がチャンネル「${getChannelName(data.channelId)}」にメッセージを投稿しました`;
      case 'page_create':
        return `${user.displayName} がスペース「${getSpaceName(data.spaceId)}」に新しいページ「${data.pageTitle}」を作成しました`;
      case 'page_update':
        return `${user.displayName} がページ「${data.pageTitle}」を更新しました`;
      case 'channel_create':
        return `${user.displayName} が新しいチャンネル「${data.channelName}」を作成しました`;
      case 'space_create':
        return `${user.displayName} が新しいスペース「${data.spaceName}」を作成しました`;
      default:
        return '不明なアクティビティ';
    }
  };

  if (loading) {
    return <div className="loading">読み込み中...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>こんにちは、{user.displayName}さん</h1>
        <p className="welcome-message">今日も素晴らしい一日をお過ごしください！</p>
      </div>
      
      <div className="dashboard-grid">
        {/* 最近のメッセージ */}
        <div className="dashboard-card recent-messages">
          <div className="card-header">
            <h2>最近のメッセージ</h2>
            <Link to="/channels">すべて表示</Link>
          </div>
          
          <div className="card-content">
            {recentMessages.length > 0 ? (
              <ul className="recent-messages-list">
                {recentMessages.map(message => (
                  <li key={message._id} className="recent-message-item">
                    <div className="message-sender">{message.sender.displayName}</div>
                    <div className="message-content">{message.content}</div>
                    <div className="message-meta">
                      <Link to={`/channel/${message.channel}`}>
                        #{getChannelName(message.channel)}
                      </Link>
                      <span className="message-time">
                        {new Date(message.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-data">最近のメッセージはありません</p>
            )}
          </div>
        </div>
        
        {/* 最近のページ */}
        <div className="dashboard-card recent-pages">
          <div className="card-header">
            <h2>最近のページ</h2>
            <Link to="/spaces">すべて表示</Link>
          </div>
          
          <div className="card-content">
            {recentPages.length > 0 ? (
              <ul className="recent-pages-list">
                {recentPages.map(page => (
                  <li key={page._id} className="recent-page-item">
                    <Link 
                      to={`/document/${page.space.key}/${page._id}`}
                      className="page-link"
                    >
                      <div className="page-title">{page.title}</div>
                      <div className="page-meta">
                        <span className="page-space">{page.space.name}</span>
                        <span className="page-time">
                          {new Date(page.updatedAt).toLocaleString()}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-data">最近のページはありません</p>
            )}
          </div>
        </div>
        
        {/* クイックアクション */}
        <div className="dashboard-card quick-actions">
          <div className="card-header">
            <h2>クイックアクション</h2>
          </div>
          
          <div className="card-content">
            <div className="quick-actions-grid">
              <Link to="/channel/new" className="quick-action-item">
                <div className="action-icon">➕</div>
                <div className="action-text">チャンネル作成</div>
              </Link>
              
              <Link to="/message/direct" className="quick-action-item">
                <div className="action-icon">✉️</div>
                <div className="action-text">ダイレクトメッセージ</div>
              </Link>
              
              <Link to="/space/new" className="quick-action-item">
                <div className="action-icon">📚</div>
                <div className="action-text">スペース作成</div>
              </Link>
              
              <Link to="/document/new" className="quick-action-item">
                <div className="action-icon">📝</div>
                <div className="action-text">ドキュメント作成</div>
              </Link>
            </div>
          </div>
        </div>
        
        {/* 最近のアクティビティ */}
        <div className="dashboard-card recent-activity">
          <div className="card-header">
            <h2>最近のアクティビティ</h2>
          </div>
          
          <div className="card-content">
            {recentActivity.length > 0 ? (
              <ul className="activity-list">
                {recentActivity.map(activity => (
                  <li key={activity._id} className="activity-item">
                    <div className="activity-icon">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="activity-details">
                      <div className="activity-description">
                        {getActivityDescription(activity)}
                      </div>
                      <div className="activity-time">
                        {new Date(activity.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-data">最近のアクティビティはありません</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;