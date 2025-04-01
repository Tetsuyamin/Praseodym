const winston = require('winston');
const path = require('path');

// ログレベル
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// ログレベルを環境に応じて設定
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'warn';
};

// ログカラー
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Winstonにカラーを追加
winston.addColors(colors);

// ログフォーマット
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// トランスポーター
const transports = [
  // コンソールへの出力
  new winston.transports.Console(),
  
  // エラーログファイル
  new winston.transports.File({
    filename: path.join('logs', 'error.log'),
    level: 'error',
  }),
  
  // すべてのログファイル
  new winston.transports.File({ filename: path.join('logs', 'all.log') }),
];

// Winstonロガーのインスタンス作成
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

module.exports = logger;