import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';

const SpaceList = () => {
  const location = useLocation();
  const { spaces } = useApp();
  const [filter, setFilter] = useState('');

  // スペースをフィルタリング
  const filteredSpaces = spaces
    .filter(space => {
      // フィルター文字列でフィルタリング
      if (filter) {
        return (
          space.name.toLowerCase().includes(filter.toLowerCase()) ||
          space.key.toLowerCase().includes(filter.toLowerCase())
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      // 最近更新されたスペースを上部に表示
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

  // 現在のスペースがアクティブかどうかを判定
  const isActiveSpace = (spaceKey) => {
    return location.pathname.includes(`/space/${spaceKey}`) || 
           location.pathname.includes(`/document/${spaceKey}`);
  };

  return (
    <div className="space-list">
      {spaces.length > 5 && (
        <div className="space-filter">
          <input
            type="text"
            className="filter-input"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="スペースを検索..."
          />
        </div>
      )}
      
      <ul className="space-items">
        {filteredSpaces.length > 0 ? (
          filteredSpaces.map(space => (
            <li
              key={space._id}
              className={`space-item ${isActiveSpace(space.key) ? 'active' : ''} ${
                space.isPrivate ? 'private' : ''
              }`}
            >
              <Link to={`/space/${space.key}`} className="space-link">
                <div className="space-icon">
                  {space.icon ? (
                    <img src={space.icon} alt={space.name} />
                  ) : (
                    <span className="default-icon">{space.key.charAt(0)}</span>
                  )}
                </div>
                <div className="space-info">
                  <span className="space-name">{space.name}</span>
                  <span className="space-key">{space.key}</span>
                </div>
                {space.isPrivate && <span className="private-icon">🔒</span>}
              </Link>
            </li>
          ))
        ) : (
          <li className="no-spaces">
            {filter ? '一致するスペースがありません' : 'スペースがありません'}
          </li>
        )}
      </ul>
    </div>
  );
};

export default SpaceList;