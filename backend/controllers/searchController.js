const Message = require('../models/Message');
const Channel = require('../models/Channel');
const Space = require('../models/Space');
const Page = require('../models/Page');
const asyncHandler = require('express-async-handler');

// @desc    コンテンツを検索する
// @route   GET /api/search
// @access  Private
const searchContent = asyncHandler(async (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    res.status(400);
    throw new Error('検索クエリは必須です');
  }
  
  const searchRegex = new RegExp(q, 'i');
  const results = [];
  
  try {
    // チャンネル検索
    const channels = await Channel.find({
      $or: [
        { name: searchRegex },
        { description: searchRegex }
      ],
      $and: [
        { 
          $or: [
            { isPrivate: false },
            { isPrivate: true, members: req.user.id }
          ]
        }
      ]
    }).limit(5);
    
    channels.forEach(channel => {
      results.push({
        id: channel._id,
        type: 'channel',
        title: channel.name,
        preview: channel.description,
        updatedAt: channel.updatedAt
      });
    });
    
    // メッセージ検索
    const messages = await Message.find({
      content: searchRegex
    })
    .populate('channel')
    .populate('sender', 'username displayName')
    .limit(10);
    
    messages.forEach(message => {
      // プライベートチャンネルのメッセージはスキップ
      if (message.channel.isPrivate && !message.channel.members.includes(req.user.id)) {
        return;
      }
      
      results.push({
        id: message._id,
        type: 'message',
        title: `${message.sender.displayName}のメッセージ`,
        preview: message.content.length > 100 ? message.content.substring(0, 100) + '...' : message.content,
        channelId: message.channel._id,
        channelName: message.channel.name,
        updatedAt: message.createdAt
      });
    });
    
    // スペース検索
    const spaces = await Space.find({
      $or: [
        { name: searchRegex },
        { key: searchRegex },
        { description: searchRegex }
      ],
      $and: [
        {
          $or: [
            { isPrivate: false },
            { isPrivate: true, 'members.user': req.user.id }
          ]
        }
      ]
    }).limit(5);
    
    spaces.forEach(space => {
      results.push({
        id: space._id,
        type: 'space',
        title: space.name,
        key: space.key,
        preview: space.description,
        updatedAt: space.updatedAt
      });
    });
    
    // ページ検索
    const accessibleSpaces = spaces.map(space => space._id);
    
    const pages = await Page.find({
      $and: [
        { space: { $in: accessibleSpaces } },
        {
          $or: [
            { title: searchRegex },
            { 'content.children.text': searchRegex },
            { tags: searchRegex }
          ]
        }
      ]
    })
    .populate('space', 'name key')
    .limit(10);
    
    pages.forEach(page => {
      results.push({
        id: page._id,
        type: 'page',
        title: page.title,
        spaceKey: page.space.key,
        spaceName: page.space.name,
        preview: page.status,
        updatedAt: page.updatedAt
      });
    });
    
    // 結果を更新日時順にソート
    results.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    res.json(results);
  } catch (err) {
    console.error('検索エラー:', err);
    res.status(500);
    throw new Error('検索処理中にエラーが発生しました');
  }
});

module.exports = {
  searchContent
};