const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const socketIo = require('socket.io');
const dotenv = require('dotenv');

// ルート
const userRoutes = require('./routes/userRoutes');
const channelRoutes = require('./routes/channelRoutes');
const messageRoutes = require('./routes/messageRoutes');
const spaceRoutes = require('./routes/spaceRoutes');
const pageRoutes = require('./routes/pageRoutes');

// ミドルウェア
const { errorHandler } = require('./middleware/error');
const { setupSocket } = require('./utils/socket');

// 環境変数の読み込み
dotenv.config();

// Expressアプリケーションの初期化
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// ミドルウェアの設定
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// データベース接続
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/praseodym')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// ルートの設定
app.use('/api/users', userRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/spaces', spaceRoutes);
app.use('/api/pages', pageRoutes);

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// 404エラーハンドリング
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// エラーハンドリングミドルウェア
app.use(errorHandler);

// WebSocketの設定
setupSocket(io);

// サーバーの起動
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server };