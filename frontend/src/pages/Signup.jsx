import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/common/Button';

const Signup = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 入力検証
    if (!username || !email || !password || !confirmPassword || !displayName) {
      setError('すべての項目を入力してください');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }
    
    if (password.length < 6) {
      setError('パスワードは6文字以上である必要があります');
      return;
    }
    
    try {
      setError('');
      setIsLoading(true);
      
      const userData = {
        username,
        email,
        password,
        displayName
      };
      
      await register(userData);
      navigate('/dashboard');
    } catch (err) {
      console.error('登録エラー:', err);
      setError(err.response?.data?.message || '登録に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
      	<div className="auth-header">
          <h1 className="auth-logo">Praseodym</h1>
          <p className="auth-description">
            コミュニケーションとドキュメント管理を一つのプラットフォームで
          </p>
        </div>
        
        <div className="auth-card">
          <h2 className="auth-title">新規登録</h2>
          
          {error && <div className="auth-error">{error}</div>}
          
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">ユーザー名</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <small className="form-hint">
                3〜20文字の英数字（ログイン時に使用します）
              </small>
            </div>
            
            <div className="form-group">
              <label htmlFor="displayName">表示名</label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
              <small className="form-hint">
                アプリ内で表示される名前
              </small>
            </div>
            
            <div className="form-group">
              <label htmlFor="email">メールアドレス</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">パスワード</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <small className="form-hint">
                6文字以上の英数字
              </small>
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">パスワード（確認）</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="form-footer">
              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={isLoading}
              >
                {isLoading ? '登録中...' : '登録する'}
              </Button>
            </div>
          </form>
          
          <div className="auth-links">
            <p>
              すでにアカウントをお持ちの場合は{' '}
              <Link to="/login" className="login-link">
                ログイン
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;