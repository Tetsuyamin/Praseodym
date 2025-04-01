const Message = require('../models/Message');
const Channel = require('../models/Channel');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const { io } = require('../utils/socket');

// @desc    メッセージを送信
// @route   POST /api/messages
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const { content, channelId, threadId, mentions, attachments } = req.body;

  // 入力チェック
  if (!content) {
    res.status(400);
    throw new Error('メッセージ内容は必須です');
  }

  if (!channelId) {
    res.status(400);
    throw new Error('チャンネルIDは必須です');
  }

  // チャンネルの存在確認
  const channel = await Channel.findById(channelId);
  if (!channel) {
    res.status(404);
    throw new Error('チャンネルが見つかりません');
  }

  // メンバーシップ確認
  if (channel.isPrivate && !channel.members.includes(req.user.id)) {
    res.status(403);
    throw new Error('このチャンネルにアクセスする権限がありません');
  }

  // スレッドの存在確認（もしあれば）
  if (threadId) {
    const thread = await Message.findById(threadId);
    if (!thread) {
      res.status(404);
      throw new Error('スレッドが見つかりません');
    }
  }

  // メッセージの作成
  const message = await Message.create({
    content,
    sender: req.user.id,
    channel: channelId,
    thread: threadId || null,
    mentions: mentions || [],
    attachments: attachments || []
  });

  // ポピュレート
  const populatedMessage = await Message.findById(message._id)
    .populate('sender', 'username displayName avatar')
    .populate('mentions', 'username displayName');

  // WebSocketを通じてリアルタイム通知
  io.to(`channel:${channelId}`).emit('newMessage', populatedMessage);

  // メンションされたユーザーに通知
  if (mentions && mentions.length > 0) {
    mentions.forEach(userId => {
      io.to(`user:${userId}`).emit('mention', {
        message: populatedMessage,
        channel: channel
      });
    });
  }

  res.status(201).json(populatedMessage);
});

// @desc    チャンネルのメッセージを取得
// @route   GET /api/messages/channel/:channelId
// @access  Private
const getChannelMessages = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  // チャンネルの存在確認
  const channel = await Channel.findById(channelId);
  if (!channel) {
    res.status(404);
    throw new Error('チャンネルが見つかりません');
  }

  // メンバーシップ確認
  if (channel.isPrivate && !channel.members.includes(req.user.id)) {
    res.status(403);
    throw new Error('このチャンネルにアクセスする権限がありません');
  }

  // メインメッセージのみ取得（スレッドではないメッセージ）
  const messages = await Message.find({
    channel: channelId,
    thread: null
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sender', 'username displayName avatar')
    .populate('mentions', 'username displayName')
    .populate({
      path: 'reactions',
      populate: {
        path: 'users',
        select: 'username displayName'
      }
    });

  // トータルカウント
  const total = await Message.countDocuments({
    channel: channelId,
    thread: null
  });

  res.json({
    messages,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    スレッドのメッセージを取得
// @route   GET /api/messages/thread/:threadId
// @access  Private
const getThreadMessages = asyncHandler(async (req, res) => {
  const { threadId } = req.params;

  // スレッドの親メッセージの存在確認
  const parentMessage = await Message.findById(threadId)
    .populate('sender', 'username displayName avatar')
    .populate('channel');

  if (!parentMessage) {
    res.status(404);
    throw new Error('スレッドが見つかりません');
  }

  // チャンネルの存在確認
  const channel = await Channel.findById(parentMessage.channel);
  if (!channel) {
    res.status(404);
    throw new Error('チャンネルが見つかりません');
  }

  // メンバーシップ確認
  if (channel.isPrivate && !channel.members.includes(req.user.id)) {
    res.status(403);
    throw new Error('このチャンネルにアクセスする権限がありません');
  }

  // スレッドの返信を取得
  const replies = await Message.find({ thread: threadId })
    .sort({ createdAt: 1 })
    .populate('sender', 'username displayName avatar')
    .populate('mentions', 'username displayName')
    .populate({
      path: 'reactions',
      populate: {
        path: 'users',
        select: 'username displayName'
      }
    });

  res.json({
    parentMessage,
    replies
  });
});

// @desc    メッセージを編集
// @route   PUT /api/messages/:id
// @access  Private
const updateMessage = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { id } = req.params;

  // メッセージの存在確認
  const message = await Message.findById(id);
  if (!message) {
    res.status(404);
    throw new Error('メッセージが見つかりません');
  }

  // 権限確認
  if (message.sender.toString() !== req.user.id) {
    res.status(403);
    throw new Error('このメッセージを編集する権限がありません');
  }

  // 編集履歴を保存
  message.editHistory.push({
    content: message.content,
    editedAt: Date.now()
  });

  // メッセージを更新
  message.content = content;
  message.isEdited = true;
  await message.save();

  // ポピュレート
  const updatedMessage = await Message.findById(id)
    .populate('sender', 'username displayName avatar')
    .populate('mentions', 'username displayName')
    .populate({
      path: 'reactions',
      populate: {
        path: 'users',
        select: 'username displayName'
      }
    });

  // WebSocketを通じてリアルタイム通知
  io.to(`channel:${message.channel}`).emit('messageUpdated', updatedMessage);

  res.json(updatedMessage);
});

// @desc    メッセージを削除
// @route   DELETE /api/messages/:id
// @access  Private
const deleteMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // メッセージの存在確認
  const message = await Message.findById(id);
  if (!message) {
    res.status(404);
    throw new Error('メッセージが見つかりません');
  }

  // 権限確認（送信者または管理者）
  if (message.sender.toString() !== req.user.id && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('このメッセージを削除する権限がありません');
  }

  // メッセージを削除
  await message.remove();

  // スレッドの返信も削除
  if (!message.thread) {
    await Message.deleteMany({ thread: id });
  }

  // WebSocketを通じてリアルタイム通知
  io.to(`channel:${message.channel}`).emit('messageDeleted', { id });

  res.json({ message: 'メッセージが削除されました' });
});

// @desc    メッセージにリアクションを追加
// @route   POST /api/messages/:id/reactions
// @access  Private
const addReaction = asyncHandler(async (req, res) => {
  const { emoji } = req.body;
  const { id } = req.params;

  // 入力チェック
  if (!emoji) {
    res.status(400);
    throw new Error('絵文字は必須です');
  }

  // メッセージの存在確認
  const message = await Message.findById(id);
  if (!message) {
    res.status(404);
    throw new Error('メッセージが見つかりません');
  }

  // 既存のリアクションを確認
  const existingReaction = message.reactions.find(r => r.emoji === emoji);
  
  if (existingReaction) {
    // ユーザーがすでにリアクションしているか確認
    const userReacted = existingReaction.users.includes(req.user.id);
    
    if (userReacted) {
      // リアクションを取り消す
      existingReaction.users = existingReaction.users.filter(
        userId => userId.toString() !== req.user.id
      );
    } else {
      // リアクションを追加
      existingReaction.users.push(req.user.id);
    }

    // 空のリアクションを削除
    if (existingReaction.users.length === 0) {
      message.reactions = message.reactions.filter(r => r.emoji !== emoji);
    }
  } else {
    // 新しいリアクションを作成
    message.reactions.push({
      emoji,
      users: [req.user.id]
    });
  }

  await message.save();

  // ポピュレート
  const updatedMessage = await Message.findById(id)
    .populate('sender', 'username displayName avatar')
    .populate('mentions', 'username displayName')
    .populate({
      path: 'reactions',
      populate: {
        path: 'users',
        select: 'username displayName'
      }
    });

  // WebSocketを通じてリアルタイム通知
  io.to(`channel:${message.channel}`).emit('messageReaction', updatedMessage);

  res.json(updatedMessage);
});

module.exports = {
  sendMessage,
  getChannelMessages,
  getThreadMessages,
  updateMessage,
  deleteMessage,
  addReaction
};