import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import Button from '../common/Button';
import Dropdown from '../common/Dropdown';

// リッチテキストエディター用のライブラリを使用
import { createEditor } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import Toolbar from './Toolbar';

const Editor = ({ pageId, spaceKey, readOnly = false }) => {
  const { user } = useAuth();
  const { currentSpace, setCurrentPage } = useApp();
  const navigate = useNavigate();
  
  const [editor] = useState(() => withHistory(withReact(createEditor())));
  const [title, setTitle] = useState('');
  const [content, setContent] = useState([
    {
      type: 'paragraph',
      children: [{ text: '' }],
    },
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [status, setStatus] = useState('draft');
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [versions, setVersions] = useState([]);

  // ページのロード
  useEffect(() => {
    const fetchPage = async () => {
      if (!pageId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(`/api/pages/${pageId}`);
        const page = response.data;
        
        setTitle(page.title);
        setContent(page.content);
        setStatus(page.status);
        setVersions(page.versions || []);
        setCurrentPage(page);
        setIsDirty(false);
        setLastSaved(new Date(page.updatedAt));
      } catch (err) {
        console.error('ページ取得エラー:', err);
        setError('ページの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
    
    return () => {
      setCurrentPage(null);
    };
  }, [pageId, setCurrentPage]);

  // 自動保存
  useEffect(() => {
    if (!autoSaveEnabled || !isDirty || saving || !pageId) {
      return;
    }

    const autoSaveTimer = setTimeout(() => {
      handleSave();
    }, 5000); // 5秒ごとに自動保存

    return () => clearTimeout(autoSaveTimer);
  }, [content, title, isDirty, autoSaveEnabled, saving, pageId]);

  // 保存処理
  const handleSave = async (newStatus = null) => {
    if (!pageId && !spaceKey) {
      return;
    }

    try {
      setSaving(true);
      
      const pageData = {
        title,
        content,
        status: newStatus || status
      };
      
      let response;
      
      if (pageId) {
        // 既存ページの更新
        response = await api.put(`/api/pages/${pageId}`, pageData);
      } else {
        // 新規ページの作成
        pageData.space = currentSpace._id;
        response = await api.post('/api/pages', pageData);
        
        // 作成後は新しいURLにリダイレクト
        navigate(`/document/${spaceKey}/${response.data._id}`);
      }
      
      setIsDirty(false);
      setLastSaved(new Date());
      setStatus(response.data.status);
      setVersions(response.data.versions || []);
      setCurrentPage(response.data);
      
      return response.data;
    } catch (err) {
      console.error('ページ保存エラー:', err);
      setError('ページの保存に失敗しました');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // 公開処理
  const handlePublish = async () => {
    try {
      await handleSave('published');
    } catch (err) {
      console.error('公開エラー:', err);
    }
  };

  // バージョンの復元
  const handleRestoreVersion = async (versionNumber) => {
    try {
      setSaving(true);
      
      const response = await api.post(`/api/pages/${pageId}/restore-version`, {
        versionNumber
      });
      
      setContent(response.data.content);
      setIsDirty(false);
      setLastSaved(new Date());
      setShowVersionHistory(false);
    } catch (err) {
      console.error('バージョン復元エラー:', err);
      setError('バージョンの復元に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  // 内容の変更
  const handleContentChange = (newContent) => {
    setContent(newContent);
    setIsDirty(true);
  };

  // タイトルの変更
  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    setIsDirty(true);
  };

  if (loading) {
    return <div className="loading">ページを読み込んでいます...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="editor-container">
      <div className="editor-header">
        {readOnly ? (
          <h1 className="page-title">{title}</h1>
        ) : (
          <input
            type="text"
            className="page-title-input"
            value={title}
            onChange={handleTitleChange}
            placeholder="ページタイトル"
            disabled={readOnly}
          />
        )}
        
        <div className="editor-actions">
          {!readOnly && (
            <>
              <div className="save-status">
                {isDirty ? (
                  <span className="unsaved">未保存</span>
                ) : lastSaved ? (
                  <span className="saved">
                    最終保存: {lastSaved.toLocaleString()}
                  </span>
                ) : null}
              </div>
              
              <Button
                onClick={() => setShowVersionHistory(!showVersionHistory)}
                variant="secondary"
              >
                履歴
              </Button>
              
              <Button
                onClick={handleSave}
                variant="primary"
                disabled={saving || !isDirty}
              >
                {saving ? '保存中...' : '保存'}
              </Button>
              
              {status !== 'published' && (
                <Button
                  onClick={handlePublish}
                  variant="success"
                  disabled={saving}
                >
                  公開
                </Button>
              )}
            </>
          )}
        </div>
      </div>
      
      {showVersionHistory && (
        <div className="version-history">
          <h3>バージョン履歴</h3>
          <ul className="version-list">
            {versions.length > 0 ? (
              versions.map((version) => (
                <li key={version.versionNumber} className="version-item">
                  <div className="version-info">
                    <span className="version-number">v{version.versionNumber}</span>
                    <span className="version-date">
                      {new Date(version.editedAt).toLocaleString()}
                    </span>
                    <span className="version-editor">
                      編集者: {version.editedBy.displayName}
                    </span>
                  </div>
                  <Button
                    onClick={() => handleRestoreVersion(version.versionNumber)}
                    variant="secondary"
                    size="sm"
                  >
                    このバージョンに戻す
                  </Button>
                </li>
              ))
            ) : (
              <li>バージョン履歴はありません</li>
            )}
          </ul>
          <Button
            onClick={() => setShowVersionHistory(false)}
            variant="secondary"
          >
            閉じる
          </Button>
        </div>
      )}
      
      <div className="editor-content">
        <Slate
          editor={editor}
          value={content}
          onChange={handleContentChange}
        >
          {!readOnly && <Toolbar />}
          <Editable
            className="content-editable"
            readOnly={readOnly}
            placeholder="内容を入力してください..."
            spellCheck
            autoFocus
          />
        </Slate>
      </div>
    </div>
  );
};

export default Editor;