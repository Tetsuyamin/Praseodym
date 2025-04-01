const express = require('express');
const router = express.Router();
const {
  createChannel,
  getChannels,
  getChannel,
  updateChannel,
  deleteChannel,
  addMember,
  removeMember,
  pinMessage,
  unpinMessage
} = require('../controllers/channelController');
const { protect } = require('../middleware/auth');

// チャンネルのCRUD操作
router.post('/', protect, createChannel);
router.get('/', protect, getChannels);
router.get('/:id', protect, getChannel);
router.put('/:id', protect, updateChannel);
router.delete('/:id', protect, deleteChannel);

// メンバー管理
router.post('/:id/members', protect, addMember);
router.delete('/:id/members/:userId', protect, removeMember);

// メッセージのピン留め
router.post('/:id/pin/:messageId', protect, pinMessage);
router.delete('/:id/pin/:messageId', protect, unpinMessage);

module.exports = router;