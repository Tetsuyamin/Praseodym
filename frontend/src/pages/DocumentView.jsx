import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import PageTree from '../components/docs/PageTree';
import Editor from '../components/docs/Editor';
import CommentSection from '../components/docs/CommentSection';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';

const DocumentView = () => {
  const { spaceKey, pageId } = useParams();
  const [searchParams] = useSearchParams();
  const commentId = searchParams.get('comment');
  const navigate = useNavigate();
  
  const { user } = useAuth();
  const {
    currentSpace,
    setCurrentSpace,
    currentPage,
    setCurrentPage,
    loading,
    error
  } = useApp();
  
  const [space, setSpace] = useState(null);
  const [page, setPage] = useState(null);
  const [isEditing, setIsEditing] = useState(pageId === 'new');
  const [showComments, setShowComments] = useState(!!commentId);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // スペース情報の取得
  useEffect(() => {
    const fetchSpace = async () => {
      if (!spaceKey) return;
      
      try {
        const response = await api.get(`/api/spaces/key/${spaceKey}`);
        setSpace(response.data);
        setCurrentSpace(response.data);
      } catch (err) {
        console.error('スペース取得エラー:', err);
      }
    };
    
    fetchSpace();
    
    return () => {
      setCurrentSpace(null);
    };
  }, [spaceKey, setCurrentSpace]);

  // ページ情報の取得
  useEffect(() => {
    const fetchPage = async () => {
      if (!pageId || pageId === 'new') {
        setLoading(false);
        setEditMode(true);
        return;
      }
  
      try {
        // ObjectIdかどうかを簡易判定（24桁の16進数文字列）
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(pageId);
        
        if (isObjectId) {
          // 通常のページID指定の場合
          const response = await api.get(`/api/pages/${pageId}`);
          setPage(response.data);
          setCurrentPage(response.data);
        } else {
          // ページIDがスペースキーとして指定された場合の処理
          console.log('PageIDがObjectIDではありません。スペースのホームページを取得します');
          // スペースのホームページを取得するAPIが必要
          // この例では省略しますが、実際はスペースのデフォルトページを取得する処理を実装
        }
        
        // コメントIDが指定されている場合はコメントを表示
        if (commentId) {
          setShowComments(true);
          // コメントまでスクロール
          setTimeout(() => {
            const commentElement = document.getElementById(`comment-${commentId}`);
            if (commentElement) {
              commentElement.scrollIntoView({ behavior: 'smooth' });
              commentElement.classList.add('highlight');
            }
          }, 500);
        }
      } catch (err) {
        console.error('ページ取得エラー:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPage();
    
    return () => {
      setCurrentPage(null);
    };
  }, [pageId, commentId, setCurrentPage]);

  // ページ保存処理
  const handleSavePage = async (pageData) => {
    try {
      let response;
      
      if (pageId === 'new') {
        // 新規ページ作成
        pageData.space = space._id;
        response = await api.post('/api/pages', pageData);
        
        // 作成されたページの表示に移動
        navigate(`/document/${spaceKey}/${response.data._id}`);
      } else {
        // 既存ページ更新
        response = await api.put(`/api/pages/${pageId}`, pageData);
      }
      
      setPage(response.data);
      setCurrentPage(response.data);
      setIsEditing(false);
      
      return response.data;
    } catch (err) {
      console.error('ページ保存エラー:', err);
      throw err;
    }
  };

  // ページ削除処理
  const handleDeletePage = async () => {
    try {
      await api.delete(`/api/pages/${pageId}`);
      navigate(`/space/${spaceKey}`);
    } catch (err) {
      console.error('ページ削除エラー:', err);
      alert('ページの削除に失敗しました');
    } finally {
      setShowDeleteModal(false);
    }
  };

  // コメント更新処理
  const handleCommentsUpdate = (updatedComments) => {
    if (!page) return;
    
    setPage({
      ...page,
      comments: updatedComments
    });
    
    setCurrentPage({
      ...page,
      comments: updatedComments
    });
  };

  // 編集権限の確認
  const canEdit = () => {
    if (!space || !user) return false;
    
    // スペース管理者は編集可能
    if (space.administrators.some(admin => admin._id === user.id)) {
      return true;
    }
    
    // メンバー権限を確認
    const member = space.members.find(m => m.user._id === user.id);
    return member && (member.role === 'admin' || member.role === 'editor');
  };

  // 削除権限の確認
  const canDelete = () => {
    if (!space || !page || !user) return false;
    
    // スペース管理者は削除可能
    if (space.administrators.some(admin => admin._id === user.id)) {
      return true;
    }
    
    // ページ作成者は削除可能
    return page.createdBy._id === user.id;
  };

  if (loading) {
    return <div className="loading">ページを読み込んでいます...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="document-view">
      <aside className="document-sidebar">
        <PageTree spaceKey={spaceKey} />
      </aside>
      
      <div className="document-content">
        {/* 新規ページ作成 */}
        {pageId === 'new' ? (
          <div className="new-page">
            <h1>新しいページ</h1>
            <Editor
              spaceKey={spaceKey}
              onSave={handleSavePage}
            />
          </div>
        ) : page ? (
          <div className="page-container">
            {/* ページヘッダー */}
            <div className="page-header">
              <div className="page-meta">
                <h1 className="page-title">{page.title}</h1>
                <div className="page-info">
                  <span className="page-author">
                    作成者: {page.createdBy.displayName}
                  </span>
                  <span className="page-date">
                    最終更新: {new Date(page.updatedAt).toLocaleString()}
                  </span>
                </div>
              </div>
              
              <div className="page-actions">
                <Button
                  variant="secondary"
                  onClick={() => setShowComments(!showComments)}
                >
                  {showComments ? 'コメントを非表示' : 'コメント'}
                </Button>
                
                {canEdit() && (
                  <Button
                    variant="primary"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? 'キャンセル' : '編集'}
                  </Button>
                )}
                
                {canDelete() && (
                  <Button
                    variant="danger"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    削除
                  </Button>
                )}
              </div>
            </div>
            
            {/* ページ内容 */}
            <div className="page-body">
              {isEditing ? (
                <Editor
                  pageId={pageId}
                  spaceKey={spaceKey}
                  onSave={handleSavePage}
                />
              ) : (
                <div className="page-content">
                  <div className="content-renderer">
                    {/* SlateのJSON形式のコンテンツをHTMLで表示 */}
                    {page.content && Array.isArray(page.content) && (
                      <div className="slate-renderer">
                        {/* 実際のレンダリング処理はここに実装 */}
                        {/* 簡略化のため直接テキストを表示 */}
                        {page.content.map((node, i) => (
                          <div key={i} className="content-node">
                            {node.children && node.children.map((child, j) => (
                              <div key={j}>
                                {child.text}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* コメントセクション */}
            {showComments && (
              <div className="page-comments">
                <CommentSection
                  pageId={pageId}
                  comments={page.comments || []}
                  onUpdate={handleCommentsUpdate}
                />
              </div>
            )}
            
            {/* 削除確認モーダル */}
            <Modal
              isOpen={showDeleteModal}
              onClose={() => setShowDeleteModal(false)}
              title="ページの削除"
              footer={
                <>
                  <Button
                    variant="secondary"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    キャンセル
                  </Button>
                  <Button
                    variant="danger"
                    onClick={handleDeletePage}
                  >
                    削除
                  </Button>
                </>
              }
            >
              <p>
                「{page.title}」を削除しますか？<br />
                この操作は元に戻せません。
              </p>
            </Modal>
          </div>
        ) : (
          <div className="page-not-found">
            <h2>ページが見つかりません</h2>
            <p>
              このページは存在しないか、アクセス権限がありません。
            </p>
            <Button
              variant="primary"
              onClick={() => navigate(`/document/new/${spaceKey}`)}
            >
              新しいページを作成
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentView;