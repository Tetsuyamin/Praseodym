import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import Avatar from './Avatar';

const UserSelect = ({
  selectedUsers = [],
  onChange,
  disabled = false,
  multiple = true,
  placeholder = 'ユーザーを選択...',
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef(null);

  // ユーザー検索
  useEffect(() => {
    const searchUsers = async () => {
      if (!query.trim()) {
        setUsers([]);
        return;
      }
      
      try {
        setLoading(true);
        const response = await api.get(`/api/users/search?q=${query}`);
        
        // 選択済みユーザーを除外
        const filteredUsers = response.data.filter(
          user => !selectedUsers.some(selected => selected._id === user._id)
        );
        
        setUsers(filteredUsers);
      } catch (err) {
        console.error('ユーザー検索エラー:', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [query, selectedUsers]);

  // クリック外のイベント検知
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // ユーザー選択処理
  const handleSelectUser = (user) => {
    if (multiple) {
      onChange([...selectedUsers, user]);
    } else {
      onChange([user]);
    }
    
    setQuery('');
    setShowDropdown(false);
  };

  // 選択解除処理
  const handleRemoveUser = (userId) => {
    onChange(selectedUsers.filter(user => user._id !== userId));
  };

  return (
    <div className={`user-select ${className}`} ref={containerRef}>
      <div className="selected-users">
        {selectedUsers.map(user => (
          <div key={user._id} className="selected-user">
            <Avatar user={user} size="xs" />
            <span className="user-name">{user.displayName}</span>
            {!disabled && (
              <button
                type="button"
                className="remove-user"
                onClick={() => handleRemoveUser(user._id)}
                aria-label={`${user.displayName}を削除`}
              >
                &times;
              </button>
            )}
          </div>
        ))}
        
        {(!multiple && selectedUsers.length === 0) || multiple ? (
          <div className="search-container">
            <input
              type="text"
              className="user-search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder={selectedUsers.length === 0 ? placeholder : ''}
              disabled={disabled}
            />
          </div>
        ) : null}
      </div>
      
      {showDropdown && query.length > 0 && (
        <div className="user-dropdown">
          {loading ? (
            <div className="dropdown-loading">検索中...</div>
          ) : users.length > 0 ? (
            <ul className="user-list">
              {users.map(user => (
                <li
                  key={user._id}
                  className="user-item"
                  onClick={() => handleSelectUser(user)}
                >
                  <Avatar user={user} size="sm" />
                  <div className="user-info">
                    <div className="user-display-name">{user.displayName}</div>
                    <div className="user-username">@{user.username}</div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="no-results">
              {query ? '一致するユーザーがありません' : 'ユーザーを検索してください'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserSelect;