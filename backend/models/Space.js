const mongoose = require('mongoose');

const SpaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'スペース名は必須です'],
      trim: true,
      maxlength: [50, 'スペース名は50文字以内である必要があります']
    },
    key: {
      type: String,
      required: [true, 'スペースキーは必須です'],
      unique: true,
      trim: true,
      maxlength: [10, 'スペースキーは10文字以内である必要があります'],
      match: [/^[A-Z0-9]+$/, 'スペースキーは大文字のアルファベットと数字のみ使用できます']
    },
    description: {
      type: String,
      maxlength: [500, '説明は500文字以内である必要があります']
    },
    icon: {
      type: String,
      default: 'default-space-icon.png'
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
    administrators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        role: {
          type: String,
          enum: ['admin', 'editor', 'viewer'],
          default: 'viewer'
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Space', SpaceSchema);