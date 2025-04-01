const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io;

// Socket.IOのセットアップ
const setupSocket = (socketIo) => {
  io = socketIo;

  // 接続イベント
  io.on('connection', async (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    try {
      // トークンの認証
      const token = socket.handshake.auth.token;
      if (!token) {
        throw new Error('認証トークンがありません');
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      const user = await User.findById(decoded.id);

      if (!user) {
        throw new Error('ユーザーが見つかりません');
      }

      // ユーザーIDをソケットに関連付け
      socket.userId = user._id;

      // ユーザー固有のルームに参加
      socket.join(`user:${user._id}`);

      // オンラインステータスを更新
      user.status = 'online';
      user.lastActive = Date.now();
      await user.save();

      // オンラインステータスをブロードキャスト
      io.emit('userStatus', {
        userId: user._id,
        status: 'online'
      });

      // チャンネル参加イベント
      socket.on('joinChannel', (channelId) => {
        socket.join(`channel:${channelId}`);
        console.log(`User ${user._id} joined channel: ${channelId}`);
      });

      // チャンネル退出イベント
      socket.on('leaveChannel', (channelId) => {
        socket.leave(`channel:${channelId}`);
        console.log(`User ${user._id} left channel: ${channelId}`);
      });

      // タイピング通知イベント
      socket.on('typing', ({ channelId, isTyping }) => {
        socket.to(`channel:${channelId}`).emit('userTyping', {
          userId: user._id,
          username: user.username,
          displayName: user.displayName,
          isTyping
        });
      });

      // 切断イベント
      socket.on('disconnect', async () => {
        console.log(`Socket disconnected: ${socket.id}`);

        // オフラインステータスを更新
        user.status = 'offline';
        user.lastActive = Date.now();
        await user.save();

        // オフラインステータスをブロードキャスト
        io.emit('userStatus', {
          userId: user._id,
          status: 'offline'
        });
      });

    } catch (error) {
      console.error('Socket authentication error:', error.message);
      socket.disconnect();
    }
  });

  return io;
};

// 初期化済みのioオブジェクトを安全に取得する関数
const getIO = () => {
  if (!io) {
    console.warn('Socket.IO has not been initialized yet');
    return null;
  }
  return io;
};

module.exports = { setupSocket, getIO };