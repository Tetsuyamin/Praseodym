import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import api from '../../utils/api';
import Editor from './Editor';
import PageTree from './PageTree';
import CommentSection from './CommentSection';
import Button from '../common/Button';
import Avatar from '../common/Avatar';

const PageView = () => {
  const { spaceKey, pageId } = useParams();
  const { currentSpace, setCurrentSpace } = useApp();
  const navigate = useNavigate();
  
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showComments, setShowComments] = useState(false);

  // スペースの取得
  useEffect(() => {
    const fetchSpace = async () => {
      if (!spaceKey) return;

      try {
        const response = await api.get(`/api/spaces/key/${spaceKey}`);
        setCurrentSpace(response.data);
      } catch (err) {
        console.error('スペース取得エラー:', err);
        setError('スペースの読み込みに失敗しました');
        setLoading(false);
      }
    };

    fetchSpace();
  }, [spaceKey, setCurrentSpace]);

  // ページの取得
  useEffect(() => {
    const fetchPage = async () => {
      if (!pageId || pageId === 'new') {
        setLoading(false);
        setEditMode(true);
        return;
      }

      try {
        const response = await api.get(`/api/pages/${pageId}`);
        setPage(response.data);
      } catch (err) {
        console.error('ページ取得エラー:', err);
        setError('ページの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    // スペースが読み込まれたら、ページを取得
    if (currentSpace) {
      fetchPage();
    }
  }, [pageId, currentSpace]);

  // 編集モードの切り替え
  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  // 削除処理
  const handleDelete = async () => {
    if (!window.confirm('このページを削除しますか？')) {
      return;
    }

    try {
      await api.delete(`/api/pages/${pageId}`);
      navigate(`/space/${spaceKey}`);
    } catch (err) {
      console.error('ページ削除エラー:', err);
      alert('ページの削除に失敗しました');
    }
  };

  if (loading) {
    return <div className="loading">ページを読み込んでいます...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="page-view-container">
      <aside className="page-sidebar">
        <PageTree />
      </aside>
      
      <div className="page-content">
        {/* 新規ページの場合 */}
        {pageId === 'new' ? (
          <Editor spaceKey={spaceKey} />
        ) : (
          <>
            {/* 既存ページの場合 */}
            {page && (
              <>
                <div className="page-header">
                  <div className="page-meta">
                    <div className="page-status">
                      <span className={`status-badge ${page.status}`}>
                        {page.status === 'draft' ? '下書き' : 
                         page.status === 'published' ? '公開済み' : 
                         page.status === 'archived' ? 'アーカイブ' : 
                         page.status}
                      </span>
                    </div>
                    
                    <div className="page-authors">
                      <div className="created-by">
                        <small>作成者:</small>
                        <Avatar user={page.createdBy} size="xs" />
                        <span>{page.createdBy.displayName}</span>
                      </div>
                      
                      {page.lastEditedBy && (
                        <div className="last-edited-by">
                          <small>最終編集者:</small>
                          <Avatar user={page.lastEditedBy} size="xs" />
                          <span>{page.lastEditedBy.displayName}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="page-dates">
                      <div className="created-at">
                        <small>作成日時:</small>
                        <span>{new Date(page.createdAt).toLocaleString()}</span>
                      </div>
                      
                      <div className="updated-at">
                        <small>更新日時:</small>
                        <span>{new Date(page.updatedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="page-actions">
                    <Button
                      onClick={() => setShowComments(!showComments)}
                      variant="secondary"
                    >
                      {showComments ? 'コメントを非表示' : 'コメントを表示'}
                    </Button>
                    
                    <Button
                      onClick={toggleEditMode}
                      variant="primary"
                    >
                      {editMode ? '閲覧モード' : '編集'}
                    </Button>
                    
                    <Button
                      onClick={handleDelete}
                      variant="danger"
                    >
                      削除
                    </Button>
                  </div>
                </div>
                
                {editMode ? (
                  <Editor pageId={pageId} spaceKey={spaceKey} />
                ) : (
                  <div className="page-view">
                    <h1 className="page-title">{page.title}</h1>
                    <Editor pageId={pageId} readOnly={true} />
                  </div>
                )}
                
                {showComments && (
                  <CommentSection pageId={pageId} comments={page.comments || []} />
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PageView;