const express = require('express');
const router = express.Router();
const {
  createPage,
  getPage,
  updatePage,
  deletePage,
  addComment,
  updateComment,
  deleteComment,
  addReply,
  restoreVersion,
  getRecentPages,
  searchPages
} = require('../controllers/pageController');
const { protect } = require('../middleware/auth');

// ページのCRUD操作
router.post('/', protect, createPage);
router.get('/:id', protect, getPage);
router.put('/:id', protect, updatePage);
router.delete('/:id', protect, deletePage);

// コメント管理
router.post('/:id/comments', protect, addComment);
router.put('/:id/comments/:commentId', protect, updateComment);
router.delete('/:id/comments/:commentId', protect, deleteComment);

// コメントの返信
router.post('/:id/comments/:commentId/replies', protect, addReply);

// バージョン管理
router.post('/:id/restore-version', protect, restoreVersion);

// ページの検索と最近のページ
router.get('/recent', protect, getRecentPages);
router.get('/search', protect, searchPages);

module.exports = router;