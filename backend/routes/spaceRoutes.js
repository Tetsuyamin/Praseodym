const express = require('express');
const router = express.Router();
const {
  createSpace,
  getSpaces,
  getSpace,
  getSpaceByKey,
  updateSpace,
  deleteSpace,
  addMember,
  removeMember,
  getSpacePages
} = require('../controllers/spaceController');
const { protect } = require('../middleware/auth');

// スペースのCRUD操作
router.post('/', protect, createSpace);
router.get('/', protect, getSpaces);
router.get('/:id', protect, getSpace);
router.get('/key/:key', protect, getSpaceByKey);
router.put('/:id', protect, updateSpace);
router.delete('/:id', protect, deleteSpace);

// メンバー管理
router.post('/:id/members', protect, addMember);
router.delete('/:id/members/:userId', protect, removeMember);

// スペース内のページ取得
router.get('/:id/pages', protect, getSpacePages);

module.exports = router;