import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import SearchBar from '../common/SearchBar';
import Dropdown from '../common/Dropdown';

const Header = () => {
  const { user, logout } = useAuth();
  const { currentChannel, currentSpace, currentPage } = useApp();
  const navigate = useNavigate();
  
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    setShowUserMenu(false);
    navigate('/profile');
  };

  const getHeaderTitle = () => {
    if (currentChannel) {
      return `# ${currentChannel.name}`;
    } else if (currentPage) {
      return currentPage.title;
    } else if (currentSpace) {
      return currentSpace.name;
    }
    return 'ダッシュボード';
  };

  const getHeaderDescription = () => {
    if (currentChannel) {
      return currentChannel.description;
    } else if (currentPage) {
      return `最終更新: ${new Date(currentPage.updatedAt).toLocaleString()}`;
    } else if (currentSpace) {
      return currentSpace.description;
    }
    return '';
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-title-section">
          <h2 className="header-title">{getHeaderTitle()}</h2>
          {getHeaderDescription() && (
            <p className="header-description">{getHeaderDescription()}</p>
          )}
        </div>

        <div className="header-actions">
          <SearchBar />
          
          <div className="user-profile" onClick={() => setShowUserMenu(!showUserMenu)}>
            <Avatar user={user} size="sm" />
            <span className="user-name">{user.displayName}</span>
            <i className="dropdown-icon">▼</i>
            
            {showUserMenu && (
              <Dropdown>
                <div className="dropdown-header">
                  <Avatar user={user} size="md" />
                  <div className="user-info">
                    <div className="user-display-name">{user.displayName}</div>
                    <div className="user-email">{user.email}</div>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <ul className="dropdown-menu">
                  <li onClick={handleProfileClick}>プロフィール設定</li>
                  <li>テーマ設定</li>
                  <li>通知設定</li>
                  <li className="dropdown-divider"></li>
                  <li className="dropdown-item-danger" onClick={handleLogout}>ログアウト</li>
                </ul>
              </Dropdown>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;