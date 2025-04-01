// pageController.js - ページ関連のコントローラー
const Page = require('../models/Page');
const Space = require('../models/Space');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// @desc    ページを作成する
// @route   POST /api/pages
// @access  Private
const createPage = asyncHandler(async (req, res) => {
  const { title, content, space, parent, tags, isTemplate } = req.body;

  // 入力チェック
  if (!title || !content || !space) {
    res.status(400);
    throw new Error('タイトル、内容、スペースIDは必須です');
  }

  // スペースの存在確認
  const spaceExists = await Space.findById(space);
  if (!spaceExists) {
    res.status(404);
    throw new Error('スペースが見つかりません');
  }

  // スペースへのアクセス権確認
  const isMember = spaceExists.members.some(
    member => member.user.toString() === req.user.id
  );

  if (!isMember) {
    res.status(403);
    throw new Error('このスペースにページを作成する権限がありません');
  }

  // 親ページの存在確認（指定されている場合）
  if (parent) {
    const parentPage = await Page.findById(parent);
    if (!parentPage) {
      res.status(404);
      throw new Error('親ページが見つかりません');
    }

    // 親ページが同じスペース内にあることを確認
    if (parentPage.space.toString() !== space) {
      res.status(400);
      throw new Error('親ページは同じスペース内に存在する必要があります');
    }
  }

  // ページの作成
  const page = await Page.create({
    title,
    content,
    space,
    parent: parent || null,
    createdBy: req.user.id,
    lastEditedBy: req.user.id,
    tags: tags || [],
    status: 'draft',
    isTemplate: isTemplate || false,
    versions: [
      {
        content,
        editedBy: req.user.id,
        editedAt: Date.now(),
        versionNumber: 1
      }
    ]
  });

  // 作成されたページを取得
  const populatedPage = await Page.findById(page._id)
    .populate('createdBy', 'username displayName avatar')
    .populate('lastEditedBy', 'username displayName avatar')
    .populate('space', 'name key')
    .populate('parent', 'title');

  res.status(201).json(populatedPage);
});

// @desc    ページを取得する
// @route   GET /api/pages/:id
// @access  Private
const getPage = asyncHandler(async (req, res) => {
  const page = await Page.findById(req.params.id)
    .populate('createdBy', 'username displayName avatar')
    .populate('lastEditedBy', 'username displayName avatar')
    .populate('space', 'name key isPrivate')
    .populate('parent', 'title')
    .populate({
      path: 'comments',
      populate: {
        path: 'author',
        select: 'username displayName avatar'
      }
    })
    .populate({
      path: 'comments.replies',
      populate: {
        path: 'author',
        select: 'username displayName avatar'
      }
    })
    .populate({
      path: 'versions',
      populate: {
        path: 'editedBy',
        select: 'username displayName avatar'
      }
    });

  if (!page) {
    res.status(404);
    throw new Error('ページが見つかりません');
  }

  // スペースへのアクセス権確認
  const space = await Space.findById(page.space._id);
  
  if (space.isPrivate) {
    const isMember = space.members.some(
      member => member.user.toString() === req.user.id
    );

    if (!isMember) {
      res.status(403);
      throw new Error('このページにアクセスする権限がありません');
    }
  }

  res.json(page);
});

// @desc    ページを更新する
// @route   PUT /api/pages/:id
// @access  Private
const updatePage = asyncHandler(async (req, res) => {
  const { title, content, tags, status } = req.body;

  // ページの存在確認
  const page = await Page.findById(req.params.id);
  if (!page) {
    res.status(404);
    throw new Error('ページが見つかりません');
  }

  // スペースへのアクセス権確認
  const space = await Space.findById(page.space);
  
  if (!space) {
    res.status(404);
    throw new Error('スペースが見つかりません');
  }

  // 編集権限の確認
  const member = space.members.find(
    member => member.user.toString() === req.user.id
  );

  if (!member || (member.role !== 'admin' && member.role !== 'editor')) {
    res.status(403);
    throw new Error('このページを編集する権限がありません');
  }

  // 新しいバージョンの作成（内容が変更された場合）
  if (content && JSON.stringify(content) !== JSON.stringify(page.content)) {
    const latestVersion = page.versions.length > 0 
      ? Math.max(...page.versions.map(v => v.versionNumber)) 
      : 0;
    
    page.versions.push({
      content: page.content,
      editedBy: req.user.id,
      editedAt: Date.now(),
      versionNumber: latestVersion + 1
    });
  }

  // ページの更新
  page.title = title || page.title;
  if (content) page.content = content;
  if (tags) page.tags = tags;
  if (status) page.status = status;
  page.lastEditedBy = req.user.id;

  const updatedPage = await page.save();

  // 更新されたページを取得
  const populatedPage = await Page.findById(updatedPage._id)
    .populate('createdBy', 'username displayName avatar')
    .populate('lastEditedBy', 'username displayName avatar')
    .populate('space', 'name key')
    .populate('parent', 'title')
    .populate({
      path: 'comments',
      populate: {
        path: 'author',
        select: 'username displayName avatar'
      }
    })
    .populate({
      path: 'versions',
      populate: {
        path: 'editedBy',
        select: 'username displayName avatar'
      }
    });

  res.json(populatedPage);
});

// @desc    ページを削除する
// @route   DELETE /api/pages/:id
// @access  Private
const deletePage = asyncHandler(async (req, res) => {
  // ページの存在確認
  const page = await Page.findById(req.params.id);
  if (!page) {
    res.status(404);
    throw new Error('ページが見つかりません');
  }

  // スペースへのアクセス権確認
  const space = await Space.findById(page.space);
  
  if (!space) {
    res.status(404);
    throw new Error('スペースが見つかりません');
  }

  // 管理者権限の確認
  const isAdmin = space.administrators.includes(req.user.id);
  const isCreator = page.createdBy.toString() === req.user.id;

  if (!isAdmin && !isCreator) {
    res.status(403);
    throw new Error('このページを削除する権限がありません');
  }

  // 子ページを検索
  const childPages = await Page.find({ parent: req.params.id });

  // 子ページの親をnullに更新
  for (const childPage of childPages) {
    childPage.parent = null;
    await childPage.save();
  }

  // ページを削除
  await page.remove();

  res.json({ message: 'ページが削除されました' });
});

// @desc    コメントを追加する
// @route   POST /api/pages/:id/comments
// @access  Private
const addComment = asyncHandler(async (req, res) => {
  const { content } = req.body;

  // 入力チェック
  if (!content) {
    res.status(400);
    throw new Error('コメント内容は必須です');
  }

  // ページの存在確認
  const page = await Page.findById(req.params.id);
  if (!page) {
    res.status(404);
    throw new Error('ページが見つかりません');
  }

  // スペースへのアクセス権確認
  const space = await Space.findById(page.space);
  
  if (space.isPrivate) {
    const isMember = space.members.some(
      member => member.user.toString() === req.user.id
    );

    if (!isMember) {
      res.status(403);
      throw new Error('このページにコメントする権限がありません');
    }
  }

  // コメントを追加
  const comment = {
    content,
    author: req.user.id,
    createdAt: Date.now(),
    replies: []
  };

  page.comments.push(comment);
  await page.save();

  // 更新されたページを取得
  const updatedPage = await Page.findById(page._id)
    .populate('comments.author', 'username displayName avatar');

  // 最新のコメントを取得
  const newComment = updatedPage.comments[updatedPage.comments.length - 1];

  res.status(201).json(newComment);
});

// @desc    コメントを更新する
// @route   PUT /api/pages/:id/comments/:commentId
// @access  Private
const updateComment = asyncHandler(async (req, res) => {
  const { content, resolved } = req.body;
  const { commentId } = req.params;

  // ページの存在確認
  const page = await Page.findById(req.params.id);
  if (!page) {
    res.status(404);
    throw new Error('ページが見つかりません');
  }

  // コメントの存在確認
  const comment = page.comments.id(commentId);
  if (!comment) {
    res.status(404);
    throw new Error('コメントが見つかりません');
  }

  // 権限確認（コメント作成者のみ更新可能）
  if (comment.author.toString() !== req.user.id) {
    res.status(403);
    throw new Error('このコメントを更新する権限がありません');
  }

  // コメントを更新
  if (content) comment.content = content;
  if (resolved !== undefined) comment.resolved = resolved;

  await page.save();

  // 更新されたページを取得
  const updatedPage = await Page.findById(page._id)
    .populate('comments.author', 'username displayName avatar');

  // 更新されたコメントを取得
  const updatedComment = updatedPage.comments.id(commentId);

  res.json(updatedComment);
});

// @desc    コメントを削除する
// @route   DELETE /api/pages/:id/comments/:commentId
// @access  Private
const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  // ページの存在確認
  const page = await Page.findById(req.params.id);
  if (!page) {
    res.status(404);
    throw new Error('ページが見つかりません');
  }

  // コメントの存在確認
  const comment = page.comments.id(commentId);
  if (!comment) {
    res.status(404);
    throw new Error('コメントが見つかりません');
  }

  // 権限確認（コメント作成者またはページ作成者のみ削除可能）
  if (comment.author.toString() !== req.user.id && page.createdBy.toString() !== req.user.id) {
    res.status(403);
    throw new Error('このコメントを削除する権限がありません');
  }

  // コメントを削除
  page.comments.pull(commentId);
  await page.save();

  res.json({ message: 'コメントが削除されました' });
});

// @desc    コメントに返信を追加する
// @route   POST /api/pages/:id/comments/:commentId/replies
// @access  Private
const addReply = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { commentId } = req.params;

  // 入力チェック
  if (!content) {
    res.status(400);
    throw new Error('返信内容は必須です');
  }

  // ページの存在確認
  const page = await Page.findById(req.params.id);
  if (!page) {
    res.status(404);
    throw new Error('ページが見つかりません');
  }

  // コメントの存在確認
  const comment = page.comments.id(commentId);
  if (!comment) {
    res.status(404);
    throw new Error('コメントが見つかりません');
  }

  // スペースへのアクセス権確認
  const space = await Space.findById(page.space);
  
  if (space.isPrivate) {
    const isMember = space.members.some(
      member => member.user.toString() === req.user.id
    );

    if (!isMember) {
      res.status(403);
      throw new Error('このコメントに返信する権限がありません');
    }
  }

  // 返信を追加
  const reply = {
    content,
    author: req.user.id,
    createdAt: Date.now()
  };

  comment.replies.push(reply);
  await page.save();

  // 更新されたページを取得
  const updatedPage = await Page.findById(page._id)
    .populate('comments.author', 'username displayName avatar')
    .populate('comments.replies.author', 'username displayName avatar');

  // 更新されたコメントを取得
  const updatedComment = updatedPage.comments.id(commentId);

  res.status(201).json(updatedComment);
});

// @desc    バージョンを復元する
// @route   POST /api/pages/:id/restore-version
// @access  Private
const restoreVersion = asyncHandler(async (req, res) => {
  const { versionNumber } = req.body;

  // 入力チェック
  if (!versionNumber) {
    res.status(400);
    throw new Error('バージョン番号は必須です');
  }

  // ページの存在確認
  const page = await Page.findById(req.params.id);
  if (!page) {
    res.status(404);
    throw new Error('ページが見つかりません');
  }

  // スペースへのアクセス権確認
  const space = await Space.findById(page.space);
  
  // 編集権限の確認
  const member = space.members.find(
    member => member.user.toString() === req.user.id
  );

  if (!member || (member.role !== 'admin' && member.role !== 'editor')) {
    res.status(403);
    throw new Error('このページを編集する権限がありません');
  }

  // バージョンの存在確認
  const version = page.versions.find(v => v.versionNumber === versionNumber);
  if (!version) {
    res.status(404);
    throw new Error('指定されたバージョンが見つかりません');
  }

  // 現在のコンテンツを新しいバージョンとして保存
  const latestVersion = Math.max(...page.versions.map(v => v.versionNumber));
  
  page.versions.push({
    content: page.content,
    editedBy: req.user.id,
    editedAt: Date.now(),
    versionNumber: latestVersion + 1
  });

  // バージョンの内容を復元
  page.content = version.content;
  page.lastEditedBy = req.user.id;

  await page.save();

  // 更新されたページを取得
  const updatedPage = await Page.findById(page._id)
    .populate('createdBy', 'username displayName avatar')
    .populate('lastEditedBy', 'username displayName avatar')
    .populate('space', 'name key')
    .populate({
      path: 'versions',
      populate: {
        path: 'editedBy',
        select: 'username displayName avatar'
      }
    });

  res.json(updatedPage);
});

// @desc    最近のページを取得する
// @route   GET /api/pages/recent
// @access  Private
const getRecentPages = asyncHandler(async (req, res) => {
  const user = req.user.id;
  const limit = parseInt(req.query.limit) || 10;

  // ユーザーがアクセスできるスペースのIDを取得
  const spaces = await Space.find({
    $or: [
      { isPrivate: false },
      { isPrivate: true, 'members.user': user }
    ]
  }).select('_id');

  const spaceIds = spaces.map(space => space._id);

  // 最近更新されたページを取得
  const recentPages = await Page.find({
    space: { $in: spaceIds }
  })
    .populate('createdBy', 'username displayName avatar')
    .populate('lastEditedBy', 'username displayName avatar')
    .populate('space', 'name key')
    .sort({ updatedAt: -1 })
    .limit(limit);

  res.json(recentPages);
});

// @desc    ページを検索する
// @route   GET /api/pages/search
// @access  Private
const searchPages = asyncHandler(async (req, res) => {
  const { q, space } = req.query;
  const user = req.user.id;

  if (!q) {
    res.status(400);
    throw new Error('検索クエリは必須です');
  }

  // アクセス可能なスペースの取得
  let accessibleSpaces;
  
  if (space) {
    // 特定のスペース内を検索
    const spaceObj = await Space.findById(space);
    
    if (!spaceObj) {
      res.status(404);
      throw new Error('スペースが見つかりません');
    }
    
    if (spaceObj.isPrivate) {
      const isMember = spaceObj.members.some(
        member => member.user.toString() === user
      );

      if (!isMember) {
        res.status(403);
        throw new Error('このスペースのページを検索する権限がありません');
      }
    }
    
    accessibleSpaces = [space];
  } else {
    // アクセス可能な全スペース内を検索
    const spaces = await Space.find({
      $or: [
        { isPrivate: false },
        { isPrivate: true, 'members.user': user }
      ]
    }).select('_id');
    
    accessibleSpaces = spaces.map(s => s._id);
  }

  // ページの検索
  const searchRegex = new RegExp(q, 'i');
  
  const pages = await Page.find({
    space: { $in: accessibleSpaces },
    $or: [
      { title: searchRegex },
      { tags: searchRegex },
      { 'comments.content': searchRegex }
    ]
  })
    .populate('createdBy', 'username displayName avatar')
    .populate('lastEditedBy', 'username displayName avatar')
    .populate('space', 'name key')
    .sort({ updatedAt: -1 });

  res.json(pages);
});

module.exports = {
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
};