const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getChannelMessages,
  getThreadMessages,
  updateMessage,
  deleteMessage,
  addReaction
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

// メッセージを送信
router.post('/', protect, sendMessage);

// チャンネルのメッセージを取得
router.get('/channel/:channelId', protect, getChannelMessages);

// スレッドのメッセージを取得
router.get('/thread/:threadId', protect, getThreadMessages);

// メッセージを編集
router.put('/:id', protect, updateMessage);

// メッセージを削除
router.delete('/:id', protect, deleteMessage);

// リアクションを追加/削除
router.post('/:id/reactions', protect, addReaction);

module.exports = router;