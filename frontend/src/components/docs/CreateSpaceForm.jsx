import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import Button from '../common/Button';
import UserSelect from '../common/UserSelect';

const ROLES = [
  { value: 'admin', label: '管理者（ページの編集・削除、メンバーの管理）' },
  { value: 'editor', label: '編集者（ページの編集・作成）' },
  { value: 'viewer', label: '閲覧者（ページの閲覧のみ）' }
];

const CreateSpaceForm = ({ onSuccess, onCancel }) => {
  const { createSpace } = useApp();
  
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [selectedRole, setSelectedRole] = useState('viewer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 名前からキーを自動生成
  const handleNameChange = (e) => {
    const newName = e.target.value;
    setName(newName);
    
    // 名前からキーを自動生成（英数字のみ、大文字に変換）
    if (!key || key === name.replace(/[^A-Za-z0-9]/g, '').toUpperCase()) {
      setKey(newName.replace(/[^A-Za-z0-9]/g, '').toUpperCase());
    }
  };

  // キーのフォーマット処理
  const handleKeyChange = (e) => {
    // 英数字のみ、大文字に変換
    const formattedKey = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    setKey(formattedKey);
  };

  // フォーム送信処理
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('スペース名を入力してください');
      return;
    }
    
    if (!key.trim()) {
      setError('スペースキーを入力してください');
      return;
    }
    
    // キーの形式を確認（大文字英数字のみ、10文字以内）
    if (!/^[A-Z0-9]{1,10}$/.test(key)) {
      setError('スペースキーは1〜10文字の大文字英数字で入力してください');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError('');
      
      const members = selectedMembers.map(member => ({
        user: member._id,
        role: selectedRole
      }));
      
      const spaceData = {
        name,
        key,
        description,
        isPrivate,
        members
      };
      
      const space = await createSpace(spaceData);
      
      if (onSuccess) {
        onSuccess(space);
      }
    } catch (err) {
      console.error('スペース作成エラー:', err);
      setError(err.response?.data?.message || 'スペースの作成に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-form" onSubmit={handleSubmit}>
      {error && <div className="form-error">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="space-name">スペース名</label>
        <input
          type="text"
          id="space-name"
          value={name}
          onChange={handleNameChange}
          placeholder="チームプロジェクト"
          required
          disabled={isSubmitting}
        />
        <small className="form-hint">
          スペースの名前を入力してください
        </small>
      </div>
      
      <div className="form-group">
        <label htmlFor="space-key">スペースキー</label>
        <input
          type="text"
          id="space-key"
          value={key}
          onChange={handleKeyChange}
          placeholder="TEAM"
          required
          maxLength={10}
          disabled={isSubmitting}
        />
        <small className="form-hint">
          1〜10文字の大文字英数字（URLの一部として使用されます）
        </small>
      </div>
      
      <div className="form-group">
        <label htmlFor="space-description">説明（任意）</label>
        <textarea
          id="space-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="このスペースの目的を入力してください"
          rows={3}
          disabled={isSubmitting}
        />
      </div>
      
      <div className="form-group">
        <div className="checkbox-group">
          <input
            type="checkbox"
            id="space-private"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            disabled={isSubmitting}
          />
          <label htmlFor="space-private">
            プライベートスペースにする
          </label>
        </div>
        <small className="form-hint">
          プライベートスペースには招待されたメンバーのみがアクセスできます
        </small>
      </div>
      
      <div className="form-group">
        <label>メンバーを追加（任意）</label>
        <UserSelect
          selectedUsers={selectedMembers}
          onChange={setSelectedMembers}
          disabled={isSubmitting}
          placeholder="ユーザーを検索..."
        />
      </div>
      
      {selectedMembers.length > 0 && (
        <div className="form-group">
          <label htmlFor="space-role">メンバーの役割</label>
          <select
            id="space-role"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            disabled={isSubmitting}
          >
            {ROLES.map(role => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
          <small className="form-hint">
            追加するメンバー全員に適用されます（あとから個別に変更可能）
          </small>
        </div>
      )}
      
      <div className="form-actions">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          キャンセル
        </Button>
        
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting || !name.trim() || !key.trim()}
        >
          {isSubmitting ? '作成中...' : 'スペースを作成'}
        </Button>
      </div>
    </form>
  );
};

export default CreateSpaceForm;