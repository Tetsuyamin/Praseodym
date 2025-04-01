const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    replies: [
      {
        content: String,
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    resolved: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const PageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'ページタイトルは必須です'],
      trim: true,
      maxlength: [200, 'タイトルは200文字以内である必要があります']
    },
    content: {
      type: Object,
      required: [true, 'ページ内容は必須です']
    },
    space: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Space',
      required: true
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Page',
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    tags: [String],
    comments: [CommentSchema],
    versions: [
      {
        content: Object,
        editedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        editedAt: {
          type: Date,
          default: Date.now
        },
        versionNumber: Number
      }
    ],
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft'
    },
    isTemplate: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Page', PageSchema);