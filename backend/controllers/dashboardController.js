const Message = require('../models/Message');
const Channel = require('../models/Channel');
const Space = require('../models/Space');
const Page = require('../models/Page');
const asyncHandler = require('express-async-handler');

// @desc    最近のメッセージを取得
// @route   GET /api/messages/recent
// @access  Private
const getRecentMessages = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const limit = parseInt(req.query.limit) || 10;

  try {
    // ユーザーがアクセス可能なチャンネルのID取得
    const channels = await Channel.find({
      $or: [
        { isPrivate: false },
        { isPrivate: true, members: userId }
      ]
    }).select('_id');

    const channelIds = channels.map(channel => channel._id);

    // 最近のメッセージを取得
    const recentMessages = await Message.find({
      channel: { $in: channelIds },
      thread: null // メインメッセージのみ
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('sender', 'username displayName avatar')
      .populate('channel', 'name');

    res.json(recentMessages);
  } catch (err) {
    console.error('最近のメッセージ取得エラー:', err);
    res.status(500);
    throw new Error('最近のメッセージの取得中にエラーが発生しました');
  }
});

// @desc    最近のページを取得
// @route   GET /api/pages/recent
// @access  Private
const getRecentPages = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const limit = parseInt(req.query.limit) || 10;

  try {
    // ユーザーがアクセス可能なスペースのID取得
    const spaces = await Space.find({
      $or: [
        { isPrivate: false },
        { isPrivate: true, 'members.user': userId }
      ]
    }).select('_id');

    const spaceIds = spaces.map(space => space._id);

    // 最近のページを取得
    const recentPages = await Page.find({
      space: { $in: spaceIds }
    })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .populate('createdBy', 'username displayName avatar')
      .populate('lastEditedBy', 'username displayName avatar')
      .populate('space', 'name key');

    res.json(recentPages);
  } catch (err) {
    console.error('最近のページ取得エラー:', err);
    res.status(500);
    throw new Error('最近のページの取得中にエラーが発生しました');
  }
});

// @desc    最近のアクティビティを取得
// @route   GET /api/activity
// @access  Private
const getActivity = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const limit = parseInt(req.query.limit) || 20;

  try {
    // アクティビティを生成する代わりに、メッセージとページ更新を組み合わせた擬似アクティビティを作成
    const activities = [];

    // 最近のメッセージを取得
    const channels = await Channel.find({
      $or: [
        { isPrivate: false },
        { isPrivate: true, members: userId }
      ]
    }).select('_id name');

    const channelIds = channels.map(channel => channel._id);
    const channelMap = channels.reduce((map, channel) => {
      map[channel._id] = channel.name;
      return map;
    }, {});

    const recentMessages = await Message.find({
      channel: { $in: channelIds },
      thread: null
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('sender', 'username displayName avatar')
      .select('createdAt sender channel content');

    recentMessages.forEach(message => {
      activities.push({
        _id: `message_${message._id}`,
        type: 'message',
        timestamp: message.createdAt,
        user: message.sender,
        data: {
          channelId: message.channel,
          channelName: channelMap[message.channel] || 'Unknown Channel',
          content: message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '')
        }
      });
    });

    // 最近のページ作成/更新を取得
    const spaces = await Space.find({
      $or: [
        { isPrivate: false },
        { isPrivate: true, 'members.user': userId }
      ]
    }).select('_id name key');

    const spaceIds = spaces.map(space => space._id);
    const spaceMap = spaces.reduce((map, space) => {
      map[space._id] = { name: space.name, key: space.key };
      return map;
    }, {});

    const recentPages = await Page.find({
      space: { $in: spaceIds }
    })
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate('createdBy', 'username displayName avatar')
      .populate('lastEditedBy', 'username displayName avatar')
      .select('createdAt updatedAt createdBy lastEditedBy title space');

    recentPages.forEach(page => {
      const isNew = page.createdAt.getTime() === page.updatedAt.getTime();
      
      activities.push({
        _id: `page_${isNew ? 'create' : 'update'}_${page._id}`,
        type: isNew ? 'page_create' : 'page_update',
        timestamp: isNew ? page.createdAt : page.updatedAt,
        user: isNew ? page.createdBy : page.lastEditedBy,
        data: {
          pageId: page._id,
          pageTitle: page.title,
          spaceId: page.space,
          spaceName: spaceMap[page.space]?.name || 'Unknown Space',
          spaceKey: spaceMap[page.space]?.key || 'UNKNOWN'
        }
      });
    });

    // 最近のチャンネル作成を取得
    const recentChannels = await Channel.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('createdBy', 'username displayName avatar')
      .select('createdAt createdBy name');

    recentChannels.forEach(channel => {
      activities.push({
        _id: `channel_create_${channel._id}`,
        type: 'channel_create',
        timestamp: channel.createdAt,
        user: channel.createdBy,
        data: {
          channelId: channel._id,
          channelName: channel.name
        }
      });
    });

    // 最近のスペース作成を取得
    const recentSpaces = await Space.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('createdBy', 'username displayName avatar')
      .select('createdAt createdBy name key');

    recentSpaces.forEach(space => {
      activities.push({
        _id: `space_create_${space._id}`,
        type: 'space_create',
        timestamp: space.createdAt,
        user: space.createdBy,
        data: {
          spaceId: space._id,
          spaceName: space.name,
          spaceKey: space.key
        }
      });
    });

    // タイムスタンプでソート
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // 上限まで切り詰める
    activities.splice(limit);

    res.json(activities);
  } catch (err) {
    console.error('アクティビティ取得エラー:', err);
    res.status(500);
    throw new Error('アクティビティの取得中にエラーが発生しました');
  }
});

module.exports = {
  getRecentMessages,
  getRecentPages,
  getActivity
};