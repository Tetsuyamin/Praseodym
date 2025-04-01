const Space = require('../models/Space');
const Page = require('../models/Page');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// @desc    スペースを作成する
// @route   POST /api/spaces
// @access  Private
const createSpace = asyncHandler(async (req, res) => {
  const { name, key, description, isPrivate, members } = req.body;

  // 入力チェック
  if (!name || !key) {
    res.status(400);
    throw new Error('スペース名とキーは必須です');
  }

  // キーのフォーマット確認（大文字のアルファベットと数字のみ）
  if (!/^[A-Z0-9]+$/.test(key)) {
    res.status(400);
    throw new Error('スペースキーは大文字のアルファベットと数字のみ使用できます');
  }

  // スペースの存在確認
  const spaceExists = await Space.findOne({ $or: [{ name }, { key }] });
  if (spaceExists) {
    res.status(400);
    throw new Error('このスペース名またはキーは既に使用されています');
  }

  // メンバーリストの作成
  const spaceMembers = [];
  
  // 作成者を管理者として追加
  spaceMembers.push({
    user: req.user.id,
    role: 'admin'
  });
  
  // 他のメンバーを追加（もし指定されていれば）
  if (members && members.length > 0) {
    for (const member of members) {
      // 作成者はすでに追加済みなのでスキップ
      if (member.user.toString() === req.user.id) continue;
      
      // ユーザーの存在確認
      const userExists = await User.findById(member.user);
      if (!userExists) continue;
      
      spaceMembers.push({
        user: member.user,
        role: member.role || 'viewer'
      });
    }
  }

  // スペースの作成
  const space = await Space.create({
    name,
    key,
    description: description || '',
    isPrivate: isPrivate || false,
    createdBy: req.user.id,
    administrators: [req.user.id],
    members: spaceMembers
  });

  // 作成されたスペースを取得
  const populatedSpace = await Space.findById(space._id)
    .populate('createdBy', 'username displayName avatar')
    .populate('administrators', 'username displayName avatar')
    .populate({
      path: 'members.user',
      select: 'username displayName avatar status'
    });

  res.status(201).json(populatedSpace);
});

// @desc    すべてのスペースを取得する
// @route   GET /api/spaces
// @access  Private
const getSpaces = asyncHandler(async (req, res) => {
  const user = req.user.id;

  // 公開スペースまたはユーザーがメンバーのプライベートスペース
  const spaces = await Space.find({
    $or: [
      { isPrivate: false },
      { isPrivate: true, 'members.user': user }
    ]
  })
    .populate('createdBy', 'username displayName avatar')
    .populate('administrators', 'username displayName avatar')
    .populate({
      path: 'members.user',
      select: 'username displayName avatar status'
    })
    .sort({ updatedAt: -1 });

  res.json(spaces);
});

// @desc    特定のスペースを取得する
// @route   GET /api/spaces/:id
// @access  Private
const getSpace = asyncHandler(async (req, res) => {
  const space = await Space.findById(req.params.id)
    .populate('createdBy', 'username displayName avatar')
    .populate('administrators', 'username displayName avatar')
    .populate({
      path: 'members.user',
      select: 'username displayName avatar status'
    });

  if (!space) {
    res.status(404);
    throw new Error('スペースが見つかりません');
  }

  // プライベートスペースのアクセス権確認
  if (space.isPrivate && !space.members.some(member => member.user._id.toString() === req.user.id)) {
    res.status(403);
    throw new Error('このスペースにアクセスする権限がありません');
  }

  res.json(space);
});

// @desc    キーからスペースを取得する
// @route   GET /api/spaces/key/:key
// @access  Private
const getSpaceByKey = asyncHandler(async (req, res) => {
  const space = await Space.findOne({ key: req.params.key })
    .populate('createdBy', 'username displayName avatar')
    .populate('administrators', 'username displayName avatar')
    .populate({
      path: 'members.user',
      select: 'username displayName avatar status'
    });

  if (!space) {
    res.status(404);
    throw new Error('スペースが見つかりません');
  }

  // プライベートスペースのアクセス権確認
  if (space.isPrivate && !space.members.some(member => member.user._id.toString() === req.user.id)) {
    res.status(403);
    throw new Error('このスペースにアクセスする権限がありません');
  }

  res.json(space);
});

// @desc    スペースを更新する
// @route   PUT /api/spaces/:id
// @access  Private
const updateSpace = asyncHandler(async (req, res) => {
  const { name, description, isPrivate, icon } = req.body;

  // スペースの存在確認
  const space = await Space.findById(req.params.id);
  if (!space) {
    res.status(404);
    throw new Error('スペースが見つかりません');
  }

  // 権限確認（管理者のみ更新可能）
  if (!space.administrators.includes(req.user.id)) {
    res.status(403);
    throw new Error('このスペースを更新する権限がありません');
  }

  // 名前の重複チェック（名前が変更される場合のみ）
  if (name && name !== space.name) {
    const spaceExists = await Space.findOne({ name });
    if (spaceExists) {
      res.status(400);
      throw new Error('このスペース名は既に使用されています');
    }
  }

  // スペースの更新
  space.name = name || space.name;
  space.description = description !== undefined ? description : space.description;
  space.isPrivate = isPrivate !== undefined ? isPrivate : space.isPrivate;
  space.icon = icon || space.icon;

  const updatedSpace = await space.save();

  // 更新されたスペースを取得
  const populatedSpace = await Space.findById(updatedSpace._id)
    .populate('createdBy', 'username displayName avatar')
    .populate('administrators', 'username displayName avatar')
    .populate({
      path: 'members.user',
      select: 'username displayName avatar status'
    });

  res.json(populatedSpace);
});

// @desc    スペースを削除する
// @route   DELETE /api/spaces/:id
// @access  Private
const deleteSpace = asyncHandler(async (req, res) => {
  const space = await Space.findById(req.params.id);

  if (!space) {
    res.status(404);
    throw new Error('スペースが見つかりません');
  }

  // 権限確認（管理者のみ削除可能）
  if (!space.administrators.includes(req.user.id)) {
    res.status(403);
    throw new Error('このスペースを削除する権限がありません');
  }

  // スペース内のページを削除
  await Page.deleteMany({ space: req.params.id });

  // スペースを削除
  await space.remove();

  res.json({ message: 'スペースが削除されました' });
});

// @desc    スペースにメンバーを追加する
// @route   POST /api/spaces/:id/members
// @access  Private
const addMember = asyncHandler(async (req, res) => {
  const { userId, role } = req.body;

  // ユーザーIDの入力チェック
  if (!userId) {
    res.status(400);
    throw new Error('ユーザーIDは必須です');
  }

  // 役割の確認
  const validRoles = ['admin', 'editor', 'viewer'];
  if (role && !validRoles.includes(role)) {
    res.status(400);
    throw new Error('無効な役割です');
  }

  // スペースの存在確認
  const space = await Space.findById(req.params.id);
  if (!space) {
    res.status(404);
    throw new Error('スペースが見つかりません');
  }

  // ユーザーの存在確認
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('ユーザーが見つかりません');
  }

  // 権限確認（管理者のみメンバー追加可能）
  if (!space.administrators.includes(req.user.id)) {
    res.status(403);
    throw new Error('このスペースにメンバーを追加する権限がありません');
  }

  // 既にメンバーかどうか確認
  const existingMember = space.members.find(
    member => member.user.toString() === userId
  );

  if (existingMember) {
    // メンバーの役割を更新
    existingMember.role = role || existingMember.role;
  } else {
    // 新しいメンバーを追加
    space.members.push({
      user: userId,
      role: role || 'viewer'
    });
  }

  // 管理者に昇格する場合
  if (role === 'admin' && !space.administrators.includes(userId)) {
    space.administrators.push(userId);
  }

  await space.save();

  // 更新されたスペースを取得
  const updatedSpace = await Space.findById(space._id)
    .populate('createdBy', 'username displayName avatar')
    .populate('administrators', 'username displayName avatar')
    .populate({
      path: 'members.user',
      select: 'username displayName avatar status'
    });

  res.json(updatedSpace);
});

// @desc    スペースからメンバーを削除する
// @route   DELETE /api/spaces/:id/members/:userId
// @access  Private
const removeMember = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // スペースの存在確認
  const space = await Space.findById(req.params.id);
  if (!space) {
    res.status(404);
    throw new Error('スペースが見つかりません');
  }

  // 権限確認（管理者のみメンバー削除可能）
  if (!space.administrators.includes(req.user.id) && userId !== req.user.id) {
    res.status(403);
    throw new Error('このスペースからメンバーを削除する権限がありません');
  }

  // 作成者が削除されようとしている場合
  if (space.createdBy.toString() === userId) {
    res.status(400);
    throw new Error('スペースの作成者は削除できません');
  }

  // メンバーかどうか確認
  const memberIndex = space.members.findIndex(
    member => member.user.toString() === userId
  );

  if (memberIndex === -1) {
    res.status(400);
    throw new Error('このユーザーはスペースのメンバーではありません');
  }

  // メンバーを削除
  space.members.splice(memberIndex, 1);

  // 管理者からも削除（作成者以外）
  if (space.administrators.includes(userId) && space.createdBy.toString() !== userId) {
    space.administrators = space.administrators.filter(
      admin => admin.toString() !== userId
    );
  }

  await space.save();

  // 更新されたスペースを取得
  const updatedSpace = await Space.findById(space._id)
    .populate('createdBy', 'username displayName avatar')
    .populate('administrators', 'username displayName avatar')
    .populate({
      path: 'members.user',
      select: 'username displayName avatar status'
    });

  res.json(updatedSpace);
});

// @desc    スペース内のページ一覧を取得する
// @route   GET /api/spaces/:id/pages
// @access  Private
const getSpacePages = asyncHandler(async (req, res) => {
  const space = await Space.findById(req.params.id);
  
  if (!space) {
    res.status(404);
    throw new Error('スペースが見つかりません');
  }

  // プライベートスペースのアクセス権確認
  if (space.isPrivate && !space.members.some(member => member.user.toString() === req.user.id)) {
    res.status(403);
    throw new Error('このスペースにアクセスする権限がありません');
  }

  // スペース内のページを取得
  const pages = await Page.find({ space: req.params.id })
    .populate('createdBy', 'username displayName avatar')
    .populate('lastEditedBy', 'username displayName avatar')
    .populate('parent', 'title')
    .sort({ updatedAt: -1 });

  res.json(pages);
});

module.exports = {
  createSpace,
  getSpaces,
  getSpace,
  getSpaceByKey,
  updateSpace,
  deleteSpace,
  addMember,
  removeMember,
  getSpacePages
};