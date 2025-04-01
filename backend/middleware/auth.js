const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// ユーザー認証ミドルウェア
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // ヘッダーからトークンを取得
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // トークンを取得
      token = req.headers.authorization.split(' ')[1];

      // トークンを検証
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

      // トークンからユーザーを取得
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        res.status(401);
        throw new Error('認証に失敗しました。有効なトークンではありません。');
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('認証に失敗しました。有効なトークンではありません。');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('認証に失敗しました。トークンがありません。');
  }
});

// 管理者権限確認ミドルウェア
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403);
    throw new Error('管理者権限が必要です');
  }
};

module.exports = { protect, admin };