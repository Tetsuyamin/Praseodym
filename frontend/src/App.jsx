import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// ページコンポーネント
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ChannelView from './pages/ChannelView';
import DocumentView from './pages/DocumentView';

// レイアウトコンポーネント
import AppLayout from './components/layout/AppLayout';

// グローバルスタイル
import './styles/global.css';

function App() {
  const { user, loading, checkAuth } = useAuth();

  // 初回マウント時に認証チェック
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // 認証が必要なルートを保護するコンポーネント
  const PrivateRoute = ({ children }) => {
    if (loading) {
      return <div className="loading">読み込み中...</div>;
    }
    return user ? children : <Navigate to="/login" />;
  };

  // 未認証ユーザー用のルート（ログイン済みユーザーはダッシュボードへリダイレクト）
  const PublicRoute = ({ children }) => {
    if (loading) {
      return <div className="loading">読み込み中...</div>;
    }
    return !user ? children : <Navigate to="/dashboard" />;
  };

  return (
    <Router>
      <Routes>
        {/* 認証ページ */}
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/signup" element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        } />

        {/* 認証が必要なページ */}
        <Route path="/" element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="channel/:channelId" element={<ChannelView />} />
          <Route path="document/:spaceKey/:pageId" element={<DocumentView />} />
          <Route path="space/:spaceKey" element={<DocumentView />} />
        </Route>

        {/* 404ページ */}
        <Route path="*" element={<div>ページが見つかりません</div>} />
      </Routes>
    </Router>
  );
}

export default App;