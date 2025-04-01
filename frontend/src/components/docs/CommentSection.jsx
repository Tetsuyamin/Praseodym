import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import { timeAgo } from '../../utils/helpers';

const CommentSection = ({ pageId, comments = [], onUpdate }) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [replyContent, setReplyContent] = useState({});
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // コメント送信
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      const response = await api.post(`/api/pages/${pageId}/comments`, {
        content: newComment.trim()
      });
      
      // 親コンポーネントに通知
      if (onUpdate) {
        onUpdate([...comments, response.data]);
      }
      
      setNewComment('');
    } catch (err) {
      console.error('コメント送信エラー:', err);
      setError('コメントの送信に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  // コメント返信
  const handleSubmitReply = async (commentId) => {
    const content = replyContent[commentId];
    if (!content || !content.trim()) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      const response = await api.post(
        `/api/pages/${pageId}/comments/${commentId}/replies`,
        { content: content.trim() }
      );
      
      // 親コンポーネントに通知
      if (onUpdate) {
        const updatedComments = comments.map(comment => {
          if (comment._id === commentId) {
            return response.data;
          }
          return comment;
        });
        
        onUpdate(updatedComments);
      }
      
      // 返信フォームをクリア
      setReplyContent({
        ...replyContent,
        [commentId]: ''
      });
    } catch (err) {
      console.error('返信送信エラー:', err);
      setError('返信の送信に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  // コメント編集
  const handleUpdateComment = async () => {
    if (!editingComment || !editContent.trim()) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      const response = await api.put(
        `/api/pages/${pageId}/comments/${editingComment}`,
        { content: editContent.trim() }
      );
      
      // 親コンポーネントに通知
      if (onUpdate) {
        const updatedComments = comments.map(comment => {
          if (comment._id === editingComment) {
            return response.data;
          }
          return comment;
        });
        
        onUpdate(updatedComments);
      }
      
      // 編集モードを終了
      setEditingComment(null);
      setEditContent('');
    } catch (err) {
      console.error('コメント更新エラー:', err);
      setError('コメントの更新に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  // コメント削除
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('このコメントを削除しますか？')) return;
    
    try {
      setError(null);
      
      await api.delete(`/api/pages/${pageId}/comments/${commentId}`);
      
      // 親コンポーネントに通知
      if (onUpdate) {
        const updatedComments = comments.filter(
          comment => comment._id !== commentId
        );
        
        onUpdate(updatedComments);
      }
    } catch (err) {
      console.error('コメント削除エラー:', err);
      setError('コメントの削除に失敗しました');
    }
  };

  // コメント解決/未解決の切り替え
  const handleToggleResolved = async (commentId, currentResolved) => {
    try {
      setError(null);
      
      const response = await api.put(
        `/api/pages/${pageId}/comments/${commentId}`,
        { resolved: !currentResolved }
      );
      
      // 親コンポーネントに通知
      if (onUpdate) {
        const updatedComments = comments.map(comment => {
          if (comment._id === commentId) {
            return response.data;
          }
          return comment;
        });
        
        onUpdate(updatedComments);
      }
    } catch (err) {
      console.error('コメントステータス更新エラー:', err);
      setError('コメントのステータス更新に失敗しました');
    }
  };

  // 返信の切り替え表示
  const toggleReplyForm = (commentId) => {
    // 初期値を設定
    if (!replyContent[commentId]) {
      setReplyContent({
        ...replyContent,
        [commentId]: ''
      });
    }
  };

  // 編集モード開始
  const startEditing = (comment) => {
    setEditingComment(comment._id);
    setEditContent(comment.content);
  };

  // 編集モードキャンセル
  const cancelEditing = () => {
    setEditingComment(null);
    setEditContent('');
  };

  return (
    <div className="comment-section">
      <h3 className="comments-heading">コメント ({comments.length})</h3>
      
      {error && <div className="comment-error">{error}</div>}
      
      {/* コメント入力 */}
      <form className="comment-form" onSubmit={handleSubmitComment}>
        <div className="comment-input-container">
          <Avatar user={user} size="sm" />
          <textarea
            className="comment-input"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="コメントを追加..."
            rows="2"
            disabled={submitting}
          />
        </div>
        
        <div className="comment-actions">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={submitting || !newComment.trim()}
          >
            {submitting ? '送信中...' : 'コメントする'}
          </Button>
        </div>
      </form>
      
      {/* コメントリスト */}
      {comments.length > 0 ? (
        <div className="comment-list">
          {comments.map(comment => (
            <div
              key={comment._id}
              className={`comment-item ${comment.resolved ? 'resolved' : ''}`}
            >
              {/* コメントヘッダー */}
              <div className="comment-header">
                <Avatar user={comment.author} size="sm" />
                <div className="comment-author">{comment.author.displayName}</div>
                <div className="comment-time" title={new Date(comment.createdAt).toLocaleString()}>
                  {timeAgo(comment.createdAt)}
                </div>
                
                {comment.resolved && (
                  <div className="resolved-badge">解決済み</div>
                )}
              </div>
              
              {/* コメント内容 */}
              {editingComment === comment._id ? (
                <div className="comment-edit">
                  <textarea
                    className="edit-input"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows="3"
                    disabled={submitting}
                  />
                  
                  <div className="edit-actions">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={cancelEditing}
                      disabled={submitting}
                    >
                      キャンセル
                    </Button>
                    
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleUpdateComment}
                      disabled={submitting || !editContent.trim()}
                    >
                      {submitting ? '更新中...' : '更新'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="comment-content">{comment.content}</div>
              )}
              
              {/* コメントアクション */}
              <div className="comment-footer">
                <div className="comment-actions">
                  <button
                    className="action-button"
                    onClick={() => toggleReplyForm(comment._id)}
                  >
                    返信
                  </button>
                  
                  {user && comment.author._id === user.id && (
                    <>
                      <button
                        className="action-button"
                        onClick={() => startEditing(comment)}
                      >
                        編集
                      </button>
                      
                      <button
                        className="action-button danger"
                        onClick={() => handleDeleteComment(comment._id)}
                      >
                        削除
                      </button>
                    </>
                  )}
                  
                  <button
                    className={`action-button ${comment.resolved ? 'warning' : 'success'}`}
                    onClick={() => handleToggleResolved(comment._id, comment.resolved)}
                  >
                    {comment.resolved ? '未解決にする' : '解決にする'}
                  </button>
                </div>
              </div>
              
              {/* 返信リスト */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="replies-list">
                  {comment.replies.map((reply, index) => (
                    <div key={index} className="reply-item">
                      <div className="reply-header">
                        <Avatar user={reply.author} size="xs" />
                        <div className="reply-author">{reply.author.displayName}</div>
                        <div className="reply-time" title={new Date(reply.createdAt).toLocaleString()}>
                          {timeAgo(reply.createdAt)}
                        </div>
                      </div>
                      
                      <div className="reply-content">{reply.content}</div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* 返信フォーム */}
              {replyContent[comment._id] !== undefined && (
                <div className="reply-form">
                  <Avatar user={user} size="xs" />
                  <textarea
                    className="reply-input"
                    value={replyContent[comment._id]}
                    onChange={(e) =>
                      setReplyContent({
                        ...replyContent,
                        [comment._id]: e.target.value
                      })
                    }
                    placeholder="返信を入力..."
                    rows="2"
                    disabled={submitting}
                  />
                  
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleSubmitReply(comment._id)}
                    disabled={submitting || !replyContent[comment._id]?.trim()}
                  >
                    {submitting ? '送信中...' : '返信'}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="no-comments">まだコメントがありません</div>
      )}
    </div>
  );
};

export default CommentSection;