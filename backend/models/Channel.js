const mongoose = require('mongoose');

const ChannelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'チャンネル名は必須です'],
      trim: true,
      maxlength: [50, 'チャンネル名は50文字以内である必要があります']
    },
    description: {
      type: String,
      maxlength: [500, '説明は500文字以内である必要があります']
    },
    isPrivate: {
      type: Boolean,
      default: false
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    pinnedMessages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Channel', ChannelSchema);