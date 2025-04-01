const express = require('express');
const router = express.Router();
const { 
  getRecentMessages, 
  getRecentPages, 
  getActivity
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

// ダッシュボード関連API
router.get('/messages/recent', protect, getRecentMessages);
router.get('/pages/recent', protect, getRecentPages);
router.get('/activity', protect, getActivity);

module.exports = router;


// backend/server.jsの修正部分（ルート登録の追加）
// app.use()の呼び出し部分に以下を追加

// 検索APIルート
app.use('/api/search', require('./routes/searchRoutes'));

// ダッシュボードAPIルート
app.use('/api', require('./routes/dashboardRoutes'));