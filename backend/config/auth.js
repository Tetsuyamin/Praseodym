const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * JWTトークンを生成する
 * @param {Object} payload - トークンのペイロード
 * @param {string} secret - シークレットキー
 * @param {string} expiresIn - 有効期限
 * @returns {string} 生成されたトークン
 */
const generateToken = (payload, secret = process.env.JWT_SECRET || 'secret', expiresIn = '30d') => {
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * JWTトークンを検証する
 * @param {string} token - 検証するトークン
 * @param {string} secret - シークレットキー
 * @returns {Object} デコードされたペイロード
 */
const verifyToken = (token, secret = process.env.JWT_SECRET || 'secret') => {
  return jwt.verify(token, secret);
};

/**
 * パスワードをハッシュ化する
 * @param {string} password - ハッシュ化するパスワード
 * @returns {string} ハッシュ化されたパスワード
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * パスワードを比較する
 * @param {string} password - 平文のパスワード
 * @param {string} hashedPassword - ハッシュ化されたパスワード
 * @returns {boolean} パスワードが一致するかどうか
 */
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * リセットトークンを生成する
 * @returns {string} 生成されたトークン
 */
const generateResetToken = () => {
  return crypto.randomBytes(20).toString('hex');
};

/**
 * トークンを暗号化する
 * @param {string} token - 暗号化するトークン
 * @returns {string} 暗号化されたトークン
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  generateResetToken,
  hashToken
};