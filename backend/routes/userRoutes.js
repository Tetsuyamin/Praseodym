const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  updateUser,
  getAllUsers,
  getUserById
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/auth');

// 認証不要のルート
router.post('/register', registerUser);
router.post('/login', loginUser);

// 認証が必要なルート
router.post('/logout', protect, logoutUser);
router.get('/me', protect, getMe);
router.put('/me', protect, updateUser);

// 全ユーザー取得（管理者のみ）
router.get('/', protect, getAllUsers);

// 特定のユーザー取得
router.get('/:id', protect, getUserById);

module.exports = router;