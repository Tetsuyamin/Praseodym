import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useApp } from '../../contexts/AppContext';

const SearchBar = () => {
  const navigate = useNavigate();
  const { channels, spaces } = useApp();
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  
  const searchRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // 検索クエリの変更を処理
  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    // 入力が止まってから検索を実行（タイピング中は実行しない）
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setIsSearching(true);
    
    searchTimeoutRef.current = setTimeout(() => {
      performSearch();
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  // クリック外の検知
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // キーボードナビゲーション
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showResults) return;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex(prev => 
            prev < results.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex(prev => prev > 0 ? prev - 1 : 0);
          break;
        case 'Enter':
          if (activeIndex >= 0 && activeIndex < results.length) {
            handleResultClick(results[activeIndex]);
          }
          break;
        case 'Escape':
          setShowResults(false);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showResults, results, activeIndex]);

  // 検索の実行
  const performSearch = async () => {
    try {
      const response = await api.get('/api/search', {
        params: { q: query }
      });
      
      setResults(response.data);
    } catch (err) {
      console.error('検索エラー:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // 結果のクリック処理
  const handleResultClick = (result) => {
    setShowResults(false);
    setQuery('');
    
    switch (result.type) {
      case 'channel':
        navigate(`/channel/${result.id}`);
        break;
      case 'message':
        navigate(`/channel/${result.channelId}?message=${result.id}`);
        break;
      case 'space':
        navigate(`/space/${result.key}`);
        break;
      case 'page':
        navigate(`/document/${result.spaceKey}/${result.id}`);
        break;
      default:
        break;
    }
  };

  // 結果アイテムのレンダリング
  const renderResultItem = (result, index) => {
    const isActive = index === activeIndex;
    
    return (
      <li 
        key={`${result.type}-${result.id}`}
        className={`search-result-item ${isActive ? 'active' : ''}`}
        onClick={() => handleResultClick(result)}
        onMouseEnter={() => setActiveIndex(index)}
      >
        <div className="result-icon">
          {result.type === 'channel' && '#'}
          {result.type === 'message' && '💬'}
          {result.type === 'space' && '📚'}
          {result.type === 'page' && '📄'}
        </div>
        
        <div className="result-content">
          <div className="result-title">{result.title}</div>
          {result.preview && (
            <div className="result-preview">{result.preview}</div>
          )}
          
          <div className="result-meta">
            {result.type === 'channel' && 'チャンネル'}
            {result.type === 'message' && 'メッセージ'}
            {result.type === 'space' && 'スペース'}
            {result.type === 'page' && 'ページ'}
            
            {result.updatedAt && (
              <span className="result-time">
                {new Date(result.updatedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </li>
    );
  };

  return (
    <div className="search-bar-container" ref={searchRef}>
      <div className="search-input-wrapper">
        <i className="search-icon">🔍</i>
        <input
          type="text"
          className="search-input"
          placeholder="検索..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(true)}
        />
        {query && (
          <button
            className="clear-search"
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
          >
            ×
          </button>
        )}
      </div>
      
      {showResults && (query.trim() !== '' || results.length > 0) && (
        <div className="search-results-container">
          {isSearching ? (
            <div className="search-loading">検索中...</div>
          ) : results.length > 0 ? (
            <ul className="search-results-list">
              {results.map((result, index) => renderResultItem(result, index))}
            </ul>
          ) : query.trim() !== '' && (
            <div className="no-results">
              '{query}' に一致する結果はありません
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;