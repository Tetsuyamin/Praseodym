/**
 * 日付をフォーマットする
 * @param {Date|string} date - 日付オブジェクトまたは日付文字列
 * @param {string} format - フォーマット ('short', 'medium', 'long', 'full')
 * @returns {string} フォーマットされた日付文字列
 */
export const formatDate = (date, format = 'medium') => {
  const d = date instanceof Date ? date : new Date(date);
  
  if (isNaN(d.getTime())) {
    return 'Invalid date';
  }
  
  const options = {
    short: { month: 'short', day: 'numeric' },
    medium: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' },
    full: { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      weekday: 'long', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    }
  };
  
  return d.toLocaleDateString(undefined, options[format] || options.medium);
};

/**
 * 経過時間を相対的な文字列で表示する
 * @param {Date|string} date - 日付オブジェクトまたは日付文字列
 * @returns {string} 相対的な時間文字列
 */
export const timeAgo = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  
  if (isNaN(d.getTime())) {
    return 'Invalid date';
  }
  
  const now = new Date();
  const seconds = Math.floor((now - d) / 1000);
  
  // 1分未満
  if (seconds < 60) {
    return '今';
  }
  
  // 1時間未満
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}分前`;
  }
  
  // 1日未満
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}時間前`;
  }
  
  // 1週間未満
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}日前`;
  }
  
  // 1ヶ月未満
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `${weeks}週間前`;
  }
  
  // 1年未満
  if (days < 365) {
    const months = Math.floor(days / 30);
    return `${months}ヶ月前`;
  }
  
  // 1年以上
  const years = Math.floor(days / 365);
  return `${years}年前`;
};

/**
 * テキスト内のURLをリンクに変換する
 * @param {string} text - 変換するテキスト
 * @returns {string} HTMLに変換されたテキスト
 */
export const linkifyText = (text) => {
  if (!text) return '';
  
  // URLを検出する正規表現
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  // URLをリンクに置換
  return text.replace(urlRegex, (url) => {
    try {
      const parsedUrl = new URL(url);
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${parsedUrl.hostname}</a>`;
    } catch (e) {
      return url;
    }
  });
};

/**
 * テキストをHTMLエスケープする
 * @param {string} text - エスケープするテキスト
 * @returns {string} エスケープされたテキスト
 */
export const escapeHtml = (text) => {
  if (!text) return '';
  
  const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  
  return text.replace(/[&<>"'/]/g, (char) => escapeMap[char]);
};

/**
 * ファイルサイズを人間が読みやすい形式に変換する
 * @param {number} bytes - ファイルサイズ（バイト）
 * @param {number} decimals - 小数点以下の桁数
 * @returns {string} 変換されたファイルサイズ
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
};

/**
 * ランダムなIDを生成する
 * @param {number} length - IDの長さ
 * @returns {string} ランダムなID
 */
export const generateId = (length = 10) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
};

/**
 * 配列をシャッフルする
 * @param {Array} array - シャッフルする配列
 * @returns {Array} シャッフルされた新しい配列
 */
export const shuffleArray = (array) => {
  const newArray = [...array];
  
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  
  return newArray;
};

/**
 * 連続した関数実行を制限する（デバウンス）
 * @param {Function} func - 実行する関数
 * @param {number} wait - 待機時間（ミリ秒）
 * @returns {Function} デバウンスされた関数
 */
export const debounce = (func, wait) => {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * 指定された時間内に一度だけ関数を実行する（スロットル）
 * @param {Function} func - 実行する関数
 * @param {number} limit - 制限時間（ミリ秒）
 * @returns {Function} スロットルされた関数
 */
export const throttle = (func, limit) => {
  let inThrottle;
  
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

/**
 * 指定されたキーによってオブジェクトの配列をグループ化する
 * @param {Array} array - グループ化する配列
 * @param {string} key - グループ化するキー
 * @returns {Object} グループ化されたオブジェクト
 */
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
};

/**
 * 平文パスワードの強度を評価する
 * @param {string} password - 評価するパスワード
 * @returns {Object} 評価結果と強度スコア
 */
export const evaluatePasswordStrength = (password) => {
  if (!password) {
    return { score: 0, feedback: '入力してください' };
  }
  
  let score = 0;
  let feedback = [];
  
  // 長さチェック
  if (password.length < 8) {
    feedback.push('8文字以上にしてください');
  } else {
    score += 1;
  }
  
  // 大文字を含むかチェック
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('大文字を含めてください');
  }
  
  // 小文字を含むかチェック
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('小文字を含めてください');
  }
  
  // 数字を含むかチェック
  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('数字を含めてください');
  }
  
  // 特殊文字を含むかチェック
  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('特殊文字を含めてください');
  }
  
  // スコアに基づいた評価
  let strength = '';
  if (score <= 1) {
    strength = '非常に弱い';
  } else if (score === 2) {
    strength = '弱い';
  } else if (score === 3) {
    strength = '中程度';
  } else if (score === 4) {
    strength = '強い';
  } else {
    strength = '非常に強い';
  }
  
  return {
    score,
    strength,
    feedback: feedback.length > 0 ? feedback : ['良好なパスワードです']
  };
};