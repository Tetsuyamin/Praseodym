const Channel = require('../models/Channel');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// @desc    チャンネルを作成する
// @route   POST /api/channels
// @access  Private
const createChannel = asyncHandler(async (req, res) => {
  const { name, description, isPrivate, members } = req.body;

  // 入力チェック
  if (!name) {
    res.status(400);
    throw new Error('チャンネル名は必須です');
  }

  // チャンネルの存在確認
  const channelExists = await Channel.findOne({ name });
  if (channelExists) {
    res.status(400);
    throw new Error('このチャンネル名は既に使用されています');
  }

  // メンバーリストの作成（作成者を含める）
  let channelMembers = [req.user.id];
  
  if (members && members.length > 0) {
    // メンバーIDの重複を排除
    const uniqueMembers = [...new Set([...channelMembers, ...members])];
    channelMembers = uniqueMembers;
  }

  // チャンネルの作成
  const channel = await Channel.create({
    name,
    description: description || '',
    isPrivate: isPrivate || false,
    createdBy: req.user.id,
    members: channelMembers
  });

  // 作成されたチャンネルを取得（メンバー情報を含める）
  const populatedChannel = await Channel.findById(channel._id)
    .populate('createdBy', 'username displayName avatar')
    .populate('members', 'username displayName avatar status');

  res.status(201).json(populatedChannel);
});

// @desc    すべてのチャンネルを取得する
// @route   GET /api/channels
// @access  Private
const getChannels = asyncHandler(async (req, res) => {
  const user = req.user.id;

  // 公開チャンネルまたはユーザーがメンバーのプライベートチャンネル
  const channels = await Channel.find({
    $or: [
      { isPrivate: false },
      { isPrivate: true, members: user }
    ]
  })
    .populate('createdBy', 'username displayName avatar')
    .populate('members', 'username displayName avatar status')
    .sort({ updatedAt: -1 });

  res.json(channels);
});

// @desc    特定のチャンネルを取得する
// @route   GET /api/channels/:id
// @access  Private
const getChannel = asyncHandler(async (req, res) => {
  const channel = await Channel.findById(req.params.id)
    .populate('createdBy', 'username displayName avatar')
    .populate('members', 'username displayName avatar status')
    .populate('pinnedMessages');

  if (!channel) {
    res.status(404);
    throw new Error('チャンネルが見つかりません');
  }

  // プライベートチャンネルのアクセス権確認
  if (channel.isPrivate && !channel.members.some(member => member._id.toString() === req.user.id)) {
    res.status(403);
    throw new Error('このチャンネルにアクセスする権限がありません');
  }

  res.json(channel);
});

// @desc    チャンネルを更新する
// @route   PUT /api/channels/:id
// @access  Private
const updateChannel = asyncHandler(async (req, res) => {
  const { name, description, isPrivate } = req.body;

  // チャンネルの存在確認
  const channel = await Channel.findById(req.params.id);
  if (!channel) {
    res.status(404);
    throw new Error('チャンネルが見つかりません');
  }

  // 権限確認（作成者または管理者のみ更新可能）
  if (channel.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('このチャンネルを更新する権限がありません');
  }

  // 名前の重複チェック（名前が変更される場合のみ）
  if (name && name !== channel.name) {
    const channelExists = await Channel.findOne({ name });
    if (channelExists) {
      res.status(400);
      throw new Error('このチャンネル名は既に使用されています');
    }
  }

  // チャンネルの更新
  channel.name = name || channel.name;
  channel.description = description !== undefined ? description : channel.description;
  channel.isPrivate = isPrivate !== undefined ? isPrivate : channel.isPrivate;

  const updatedChannel = await channel.save();

  // 更新されたチャンネルを取得（メンバー情報を含める）
  const populatedChannel = await Channel.findById(updatedChannel._id)
    .populate('createdBy', 'username displayName avatar')
    .populate('members', 'username displayName avatar status');

  res.json(populatedChannel);
});

// @desc    チャンネルを削除する
// @route   DELETE /api/channels/:id
// @access  Private
const deleteChannel = asyncHandler(async (req, res) => {
  const channel = await Channel.findById(req.params.id);

  if (!channel) {
    res.status(404);
    throw new Error('チャンネルが見つかりません');
  }

  // 権限確認（作成者または管理者のみ削除可能）
  if (channel.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('このチャンネルを削除する権限がありません');
  }

  await channel.remove();

  res.json({ message: 'チャンネルが削除されました' });
});

// @desc    チャンネルにメンバーを追加する
// @route   POST /api/channels/:id/members
// @access  Private
const addMember = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  // ユーザーIDの入力チェック
  if (!userId) {
    res.status(400);
    throw new Error('ユーザーIDは必須です');
  }

  // チャンネルの存在確認
  const channel = await Channel.findById(req.params.id);
  if (!channel) {
    res.status(404);
    throw new Error('チャンネルが見つかりません');
  }

  // ユーザーの存在確認
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('ユーザーが見つかりません');
  }

  // 権限確認（プライベートチャンネルの場合は作成者またはメンバーのみ追加可能）
  if (channel.isPrivate && 
      channel.createdBy.toString() !== req.user.id && 
      !channel.members.includes(req.user.id) && 
      req.user.role !== 'admin') {
    res.status(403);
    throw new Error('このチャンネルにメンバーを追加する権限がありません');
  }

  // 既にメンバーかどうか確認
  if (channel.members.includes(userId)) {
    res.status(400);
    throw new Error('このユーザーは既にチャンネルのメンバーです');
  }

  // メンバーを追加
  channel.members.push(userId);
  await channel.save();

  // 更新されたチャンネルを取得
  const updatedChannel = await Channel.findById(channel._id)
    .populate('createdBy', 'username displayName avatar')
    .populate('members', 'username displayName avatar status');

  res.json(updatedChannel);
});

// @desc    チャンネルからメンバーを削除する
// @route   DELETE /api/channels/:id/members/:userId
// @access  Private
const removeMember = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // チャンネルの存在確認
  const channel = await Channel.findById(req.params.id);
  if (!channel) {
    res.status(404);
    throw new Error('チャンネルが見つかりません');
  }

  // 権限確認（作成者、自分自身、または管理者のみ削除可能）
  if (channel.createdBy.toString() !== req.user.id && 
      userId !== req.user.id && 
      req.user.role !== 'admin') {
    res.status(403);
    throw new Error('このチャンネルからメンバーを削除する権限がありません');
  }

  // 作成者が自分自身を削除しようとしている場合
  if (channel.createdBy.toString() === userId) {
    res.status(400);
    throw new Error('チャンネルの作成者はメンバーから削除できません');
  }

  // メンバーかどうか確認
  if (!channel.members.includes(userId)) {
    res.status(400);
    throw new Error('このユーザーはチャンネルのメンバーではありません');
  }

  // メンバーを削除
  channel.members = channel.members.filter(
    member => member.toString() !== userId
  );
  await channel.save();

  // 更新されたチャンネルを取得
  const updatedChannel = await Channel.findById(channel._id)
    .populate('createdBy', 'username displayName avatar')
    .populate('members', 'username displayName avatar status');

  res.json(updatedChannel);
});

// @desc    メッセージをピン留めする
// @route   POST /api/channels/:id/pin/:messageId
// @access  Private
const pinMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;

  // チャンネルの存在確認
  const channel = await Channel.findById(req.params.id);
  if (!channel) {
    res.status(404);
    throw new Error('チャンネルが見つかりません');
  }

  // 権限確認（メンバーのみピン留め可能）
  if (!channel.members.includes(req.user.id) && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('このチャンネルにメッセージをピン留めする権限がありません');
  }

  // 既にピン留めされているか確認
  if (channel.pinnedMessages.includes(messageId)) {
    res.status(400);
    throw new Error('このメッセージは既にピン留めされています');
  }

  // メッセージをピン留め
  channel.pinnedMessages.push(messageId);
  await channel.save();

  // 更新されたチャンネルを取得
  const updatedChannel = await Channel.findById(channel._id)
    .populate('createdBy', 'username displayName avatar')
    .populate('members', 'username displayName avatar status')
    .populate('pinnedMessages');

  res.json(updatedChannel);
});

// @desc    メッセージのピン留めを解除する
// @route   DELETE /api/channels/:id/pin/:messageId
// @access  Private
const unpinMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;

  // チャンネルの存在確認
  const channel = await Channel.findById(req.params.id);
  if (!channel) {
    res.status(404);
    throw new Error('チャンネルが見つかりません');
  }

  // 権限確認（メンバーのみピン留め解除可能）
  if (!channel.members.includes(req.user.id) && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('このチャンネルのメッセージのピン留めを解除する権限がありません');
  }

  // ピン留めされているか確認
  if (!channel.pinnedMessages.includes(messageId)) {
    res.status(400);
    throw new Error('このメッセージはピン留めされていません');
  }

  // ピン留めを解除
  channel.pinnedMessages = channel.pinnedMessages.filter(
    pinned => pinned.toString() !== messageId
  );
  await channel.save();

  // 更新されたチャンネルを取得
  const updatedChannel = await Channel.findById(channel._id)
    .populate('createdBy', 'username displayName avatar')
    .populate('members', 'username displayName avatar status')
    .populate('pinnedMessages');

  res.json(updatedChannel);
});

module.exports = {
  createChannel,
  getChannels,
  getChannel,
  updateChannel,
  deleteChannel,
  addMember,
  removeMember,
  pinMessage,
  unpinMessage
};