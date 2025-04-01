import React, { createContext, useState, useContext, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // トークンの取得
  const getToken = () => localStorage.getItem('token');

  // トークンの設定
  const setToken = (token) => {
    if (token) {
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    }
  };

  // 認証状態のチェック
  const checkAuth = useCallback(async () => {
    setLoading(true);
    const token = getToken();

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await api.get('/api/users/me');
      setUser(response.data);
    } catch (err) {
      console.error('認証エラー:', err);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // ログイン
  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/users/login', { email, password });
      setToken(response.data.token);
      setUser(response.data);
      return response.data;
    } catch (err) {
      console.error('ログインエラー:', err);
      setError(err.response?.data?.message || 'ログインに失敗しました');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 登録
  const register = async (userData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/users/register', userData);
      setToken(response.data.token);
      setUser(response.data);
      return response.data;
    } catch (err) {
      console.error('登録エラー:', err);
      setError(err.response?.data?.message || '登録に失敗しました');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ログアウト
  const logout = async () => {
    setLoading(true);
    
    try {
      if (user) {
        await api.post('/api/users/logout');
      }
    } catch (err) {
      console.error('ログアウトエラー:', err);
    } finally {
      setToken(null);
      setUser(null);
      setLoading(false);
    }
  };

  // ユーザー情報更新
  const updateProfile = async (userData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.put('/api/users/me', userData);
      setUser({ ...user, ...response.data });
      return response.data;
    } catch (err) {
      console.error('プロフィール更新エラー:', err);
      setError(err.response?.data?.message || 'プロフィールの更新に失敗しました');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // コンテキスト値
  const value = {
    user,
    loading,
    error,
    checkAuth,
    login,
    register,
    logout,
    updateProfile,
    getToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};