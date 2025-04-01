import axios from 'axios';

// APIのベースURL
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Axiosインスタンスの作成
const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// リクエストインターセプター（リクエスト送信前の処理）
api.interceptors.request.use(
  (config) => {
    // ローカルストレージからトークンを取得
    const token = localStorage.getItem('token');
    
    // トークンがある場合はヘッダーに設定
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// レスポンスインターセプター（レスポンス受信後の処理）
api.interceptors.response.use(
  (response) => {
    // 成功レスポンスはそのまま返す
    return response;
  },
  (error) => {
    // エラーハンドリング
    
    // 認証エラー（401）
    if (error.response && error.response.status === 401) {
      // トークンが無効な場合はログアウト
      localStorage.removeItem('token');
      // リダイレクトが必要な場合はここに処理を追加
    }
    
    // カスタムエラーメッセージがレスポンスに含まれている場合
    if (error.response && error.response.data && error.response.data.message) {
      error.message = error.response.data.message;
    }
    
    return Promise.reject(error);
  }
);

export default api;