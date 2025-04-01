const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * データベース接続関数
 */
const connectDB = async () => {
  try {
    // MongoDB接続設定
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/praseodym';
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: true, // インデックスを自動的に構築する（開発環境用）
      serverSelectionTimeoutMS: 5000, // サーバー選択タイムアウト
      socketTimeoutMS: 45000, // ソケットタイムアウト
      family: 4 // IPv4の使用を強制
    };

    const conn = await mongoose.connect(mongoURI, options);
    
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // 接続エラーのハンドリング
    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err}`);
    });
    
    // 切断されたときの再接続
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected, trying to reconnect...');
      setTimeout(() => {
        mongoose.connect(mongoURI, options);
      }, 5000);
    });
    
    // プロセス終了時の接続クローズ
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });
    
    return conn;
  } catch (err) {
    logger.error(`Error connecting to MongoDB: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;