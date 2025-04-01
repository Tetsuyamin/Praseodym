import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/common/Button';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('メールアドレスとパスワードを入力してください');
      return;
    }
    
    try {
      setError('');
      setIsLoading(true);
      
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('ログインエラー:', err);
      setError(err.response?.data?.message || 'ログインに失敗しました');
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
          <h2 className="auth-title">ログイン</h2>
          
          {error && <div className="auth-error">{error}</div>}
          
          <form className="auth-form" onSubmit={handleSubmit}>
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
            </div>
            
            <div className="form-footer">
              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={isLoading}
              >
                {isLoading ? 'ログイン中...' : 'ログイン'}
              </Button>
            </div>
          </form>
          
          <div className="auth-links">
            <Link to="/forgot-password" className="forgot-password-link">
              パスワードをお忘れですか？
            </Link>
            <div className="auth-separator">または</div>
            <p>
              アカウントをお持ちでない場合は{' '}
              <Link to="/signup" className="signup-link">
                新規登録
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;