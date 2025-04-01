import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// リクエストインターセプター - トークンを追加
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('トークン付与：リクエスト送信', config.url); // デバッグ用
    } else {
      console.warn('認証トークンがありません'); // デバッグ用
    }
    return config;
  },
  (error) => {
    console.error('APIリクエストエラー:', error);
    return Promise.reject(error);
  }
);

// レスポンスインターセプター - エラーハンドリング
api.interceptors.response.use(
  (response) => {
    console.log('APIレスポンス成功:', response.config.url); // デバッグ用
    return response;
  },
  (error) => {
    if (error.response) {
      // サーバーからのレスポンスがある場合
      console.error('APIエラーレスポンス:', error.response.status, error.response.data);
      
      // 401エラーの場合はログアウト処理
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        // Optionally redirect to login page
        // window.location.href = '/login';
      }
    } else if (error.request) {
      // リクエストは送信されたがレスポンスがない場合
      console.error('APIレスポンスなし:', error.request);
    } else {
      // リクエスト設定中にエラーが発生した場合
      console.error('APIリクエスト設定エラー:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;