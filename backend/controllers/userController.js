const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// @desc    ユーザー登録
// @route   POST /api/users/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, displayName } = req.body;

  // 入力チェック
  if (!username || !email || !password || !displayName) {
    res.status(400);
    throw new Error('すべての必須フィールドを入力してください');
  }

  // ユーザーの存在確認
  const userExists = await User.findOne({ $or: [{ email }, { username }] });
  if (userExists) {
    res.status(400);
    throw new Error('このユーザー名またはメールアドレスは既に使用されています');
  }

  // ユーザーの作成
  const user = await User.create({
    username,
    email,
    password,
    displayName
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      avatar: user.avatar,
      role: user.role,
      token: user.getSignedJwtToken()
    });
  } else {
    res.status(400);
    throw new Error('無効なユーザーデータです');
  }
});

// @desc    ユーザーログイン
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // 入力チェック
  if (!email || !password) {
    res.status(400);
    throw new Error('メールアドレスとパスワードを入力してください');
  }

  // ユーザーの検索
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    res.status(401);
    throw new Error('無効な認証情報です');
  }

  // パスワードの検証
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    res.status(401);
    throw new Error('無効な認証情報です');
  }

  // ユーザーのステータスを更新
  user.status = 'online';
  user.lastActive = Date.now();
  await user.save();

  res.json({
    _id: user._id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    avatar: user.avatar,
    role: user.role,
    status: user.status,
    token: user.getSignedJwtToken()
  });
});

// @desc    ログアウト
// @route   POST /api/users/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res) => {
  // ユーザーのステータスを更新
  const user = await User.findById(req.user.id);
  user.status = 'offline';
  user.lastActive = Date.now();
  await user.save();

  res.json({ message: 'ログアウトに成功しました' });
});

// @desc    現在のユーザー情報を取得
// @route   GET /api/users/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error('ユーザーが見つかりません');
  }

  res.json({
    _id: user._id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    avatar: user.avatar,
    role: user.role,
    status: user.status
  });
});

// @desc    ユーザー情報を更新
// @route   PUT /api/users/me
// @access  Private
const updateUser = asyncHandler(async (req, res) => {
  const { displayName, avatar, status } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error('ユーザーが見つかりません');
  }

  if (displayName) user.displayName = displayName;
  if (avatar) user.avatar = avatar;
  if (status) user.status = status;

  const updatedUser = await user.save();

  res.json({
    _id: updatedUser._id,
    username: updatedUser.username,
    email: updatedUser.email,
    displayName: updatedUser.displayName,
    avatar: updatedUser.avatar,
    role: updatedUser.role,
    status: updatedUser.status
  });
});

// @desc    すべてのユーザーを取得
// @route   GET /api/users
// @access  Private
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password');
  res.json(users);
});

// @desc    特定のユーザーを取得
// @route   GET /api/users/:id
// @access  Private
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    res.status(404);
    throw new Error('ユーザーが見つかりません');
  }
  res.json(user);
});

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  updateUser,
  getAllUsers,
  getUserById
};