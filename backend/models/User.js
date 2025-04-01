const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'ユーザー名は必須です'],
      unique: true,
      trim: true,
      minlength: [3, 'ユーザー名は3文字以上である必要があります'],
      maxlength: [20, 'ユーザー名は20文字以内である必要があります']
    },
    email: {
      type: String,
      required: [true, 'メールアドレスは必須です'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        '有効なメールアドレスを入力してください'
      ]
    },
    password: {
      type: String,
      required: [true, 'パスワードは必須です'],
      minlength: [6, 'パスワードは6文字以上である必要があります'],
      select: false
    },
    displayName: {
      type: String,
      required: [true, '表示名は必須です']
    },
    avatar: {
      type: String,
      default: 'default-avatar.png'
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'away', 'do_not_disturb'],
      default: 'offline'
    },
    lastActive: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// パスワードのハッシュ化
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// JWTの生成
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// パスワードの検証
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);