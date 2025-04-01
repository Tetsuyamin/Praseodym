const mongoose = require('mongoose');

const ReactionSchema = new mongoose.Schema({
  emoji: {
    type: String,
    required: true
  },
  users: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ]
});

const MessageSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, 'メッセージ内容は必須です'],
      trim: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel'
    },
    thread: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    reactions: [ReactionSchema],
    attachments: [
      {
        name: String,
        url: String,
        type: String
      }
    ],
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    isEdited: {
      type: Boolean,
      default: false
    },
    editHistory: [
      {
        content: String,
        editedAt: Date
      }
    ]
  },
  {
    timestamps: true
  }
);

// スレッドメッセージの数をカウントするための仮想フィールド
MessageSchema.virtual('threadCount', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'thread',
  count: true
});

// 仮想フィールドをJSON化する際に含める
MessageSchema.set('toJSON', { virtuals: true });
MessageSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Message', MessageSchema);