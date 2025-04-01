import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import api from '../../utils/api';
import Button from '../common/Button';

const PageTree = () => {
  const { spaceKey } = useParams();
  const { currentSpace } = useApp();
  
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState({});

  // ページ一覧の取得
  useEffect(() => {
    const fetchPages = async () => {
      if (!currentSpace) return;

      try {
        setLoading(true);
        const response = await api.get(`/api/spaces/${currentSpace._id}/pages`);
        setPages(response.data);
      } catch (err) {
        console.error('ページ取得エラー:', err);
        setError('ページ一覧の読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchPages();
  }, [currentSpace]);

  // ツリー構造への変換
  const buildPageTree = () => {
    const tree = [];
    const lookup = {};
    
    // ルックアップテーブルの作成
    pages.forEach(page => {
      lookup[page._id] = { ...page, children: [] };
    });
    
    // ツリー構造の構築
    pages.forEach(page => {
      if (page.parent) {
        if (lookup[page.parent]) {
          lookup[page.parent].children.push(lookup[page._id]);
        }
      } else {
        tree.push(lookup[page._id]);
      }
    });
    
    return tree;
  };

  // ノードの展開/折りたたみ
  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  // ツリーノードの再帰的レンダリング
  const renderTreeNode = (node) => {
    const isExpanded = expandedNodes[node._id];
    const hasChildren = node.children && node.children.length > 0;
    
    return (
      <li key={node._id} className="page-tree-node">
        <div className="page-tree-item">
          {hasChildren && (
            <span
              className={`expand-toggle ${isExpanded ? 'expanded' : 'collapsed'}`}
              onClick={() => toggleNode(node._id)}
            >
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
          
          <Link
            to={`/document/${spaceKey}/${node._id}`}
            className="page-link"
          >
            {node.title}
          </Link>
        </div>
        
        {hasChildren && isExpanded && (
          <ul className="page-tree-children">
            {node.children.map(child => renderTreeNode(child))}
          </ul>
        )}
      </li>
    );
  };

  if (loading) {
    return <div className="loading">ページツリーを読み込んでいます...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const pageTree = buildPageTree();

  return (
    <div className="page-tree-container">
      <div className="page-tree-header">
        <h3>ページ一覧</h3>
        <Link to={`/document/new/${spaceKey}`}>
          <Button variant="primary" size="sm">新規ページ</Button>
        </Link>
      </div>
      
      {pageTree.length > 0 ? (
        <ul className="page-tree">
          {pageTree.map(node => renderTreeNode(node))}
        </ul>
      ) : (
        <div className="no-pages">
          <p>ページがありません</p>
          <Link to={`/document/new/${spaceKey}`}>
            <Button variant="primary">最初のページを作成</Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default PageTree;