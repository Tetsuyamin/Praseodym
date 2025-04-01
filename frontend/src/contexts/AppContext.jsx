import React, { createContext, useState, useContext, useEffect } from 'react';
import { io } from 'socket.io-client';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const { user, getToken } = useAuth();
  
  const [socket, setSocket] = useState(null);
  const [channels, setChannels] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [currentSpace, setCurrentSpace] = useState(null);
  const [currentPage, setCurrentPage] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // WebSocketの初期化
  useEffect(() => {
    if (user) {
      const token = getToken();
      const socketInstance = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
        auth: {
          token
        }
      });

      // 接続イベント
      socketInstance.on('connect', () => {
        console.log('Socket connected');
      });

      // 切断イベント
      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      // ユーザーステータスイベント
      socketInstance.on('userStatus', ({ userId, status }) => {
        setOnlineUsers(prev => ({
          ...prev,
          [userId]: status
        }));
      });

      // 新しいメッセージイベント
      socketInstance.on('newMessage', (message) => {
        // 現在のチャンネルなら通知は不要
        if (currentChannel && message.channel === currentChannel._id) {
          return;
        }

        // 通知を追加
        setNotifications(prev => [
          {
            id: message._id,
            type: 'message',
            content: message.content,
            sender: message.sender,
            channel: message.channel,
            createdAt: message.createdAt
          },
          ...prev
        ]);
      });

      // メンションイベント
      socketInstance.on('mention', ({ message, channel }) => {
        setNotifications(prev => [
          {
            id: message._id,
            type: 'mention',
            content: message.content,
            sender: message.sender,
            channel: channel,
            createdAt: message.createdAt
          },
          ...prev
        ]);
      });

      setSocket(socketInstance);

      // クリーンアップ
      return () => {
        socketInstance.disconnect();
      };
    }
  }, [user, getToken, currentChannel]);

  // チャンネル一覧の取得
  const fetchChannels = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await api.get('/api/channels');
      setChannels(response.data);
    } catch (err) {
      console.error('チャンネル取得エラー:', err);
      setError(err.response?.data?.message || 'チャンネルの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // スペース一覧の取得
  const fetchSpaces = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await api.get('/api/spaces');
      setSpaces(response.data);
    } catch (err) {
      console.error('スペース取得エラー:', err);
      setError(err.response?.data?.message || 'スペースの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 初期データの読み込み
  useEffect(() => {
    if (user) {
      fetchChannels();
      fetchSpaces();
    }
  }, [user]);

  // チャンネル参加
  const joinChannel = (channelId) => {
    if (socket) {
      socket.emit('joinChannel', channelId);
    }
  };

  // チャンネル退出
  const leaveChannel = (channelId) => {
    if (socket) {
      socket.emit('leaveChannel', channelId);
    }
  };

  // メッセージ送信
  const sendMessage = async (content, channelId, threadId = null, attachments = []) => {
    if (!user) return;

    try {
      const response = await api.post('/api/messages', {
        content,
        channelId,
        threadId,
        attachments
      });
      return response.data;
    } catch (err) {
      console.error('メッセージ送信エラー:', err);
      setError(err.response?.data?.message || 'メッセージの送信に失敗しました');
      throw err;
    }
  };

  // 通知の削除
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // チャンネル作成
  const createChannel = async (channelData) => {
    setLoading(true);
    try {
      const response = await api.post('/api/channels', channelData);
      setChannels(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      console.error('チャンネル作成エラー:', err);
      setError(err.response?.data?.message || 'チャンネルの作成に失敗しました');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // スペース作成
  const createSpace = async (spaceData) => {
    setLoading(true);
    try {
      const response = await api.post('/api/spaces', spaceData);
      setSpaces(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      console.error('スペース作成エラー:', err);
      setError(err.response?.data?.message || 'スペースの作成に失敗しました');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ページ作成
  const createPage = async (pageData) => {
    setLoading(true);
    try {
      const response = await api.post('/api/pages', pageData);
      return response.data;
    } catch (err) {
      console.error('ページ作成エラー:', err);
      setError(err.response?.data?.message || 'ページの作成に失敗しました');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // コンテキスト値
  const value = {
    socket,
    channels,
    spaces,
    currentChannel,
    setCurrentChannel,
    currentSpace,
    setCurrentSpace,
    currentPage,
    setCurrentPage,
    onlineUsers,
    loading,
    error,
    notifications,
    joinChannel,
    leaveChannel,
    sendMessage,
    removeNotification,
    createChannel,
    createSpace,
    createPage,
    fetchChannels,
    fetchSpaces
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};