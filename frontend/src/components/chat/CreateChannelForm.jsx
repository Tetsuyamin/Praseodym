import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import Button from '../common/Button';
import UserSelect from '../common/UserSelect';

const CreateChannelForm = ({ onSuccess, onCancel }) => {
  const { createChannel } = useApp();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // フォーム送信処理
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('チャンネル名を入力してください');
      return;
    }
    
    // チャンネル名の形式を確認（半角英数字、ハイフン、アンダースコア）
    if (!/^[a-z0-9\-_]+$/.test(name)) {
      setError('チャンネル名には半角英小文字、数字、ハイフン、アンダースコアのみ使用できます');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError('');
      
      const channelData = {
        name,
        description,
        isPrivate,
        members: selectedMembers.map(member => member._id)
      };
      
      const channel = await createChannel(channelData);
      
      if (onSuccess) {
        onSuccess(channel);
      }
    } catch (err) {
      console.error('チャンネル作成エラー:', err);
      setError(err.response?.data?.message || 'チャンネルの作成に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="channel-form" onSubmit={handleSubmit}>
      {error && <div className="form-error">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="channel-name">チャンネル名</label>
        <div className="channel-name-input">
          <span className="channel-prefix">#</span>
          <input
            type="text"
            id="channel-name"
            value={name}
            onChange={(e) => setName(e.target.value.toLowerCase())}
            placeholder="新しいチャンネル"
            required
            disabled={isSubmitting}
          />
        </div>
        <small className="form-hint">
          半角英小文字、数字、ハイフン、アンダースコアのみ使用できます
        </small>
      </div>
      
      <div className="form-group">
        <label htmlFor="channel-description">説明（任意）</label>
        <input
          type="text"
          id="channel-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="このチャンネルの目的を入力してください"
          disabled={isSubmitting}
        />
        <small className="form-hint">
          このチャンネルの目的や話題を簡潔に説明してください
        </small>
      </div>
      
      <div className="form-group">
        <div className="checkbox-group">
          <input
            type="checkbox"
            id="channel-private"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            disabled={isSubmitting}
          />
          <label htmlFor="channel-private">
            プライベートチャンネルにする
          </label>
        </div>
        <small className="form-hint">
          プライベートチャンネルには招待されたメンバーのみがアクセスできます
        </small>
      </div>
      
      {isPrivate && (
        <div className="form-group">
          <label>メンバーを追加（任意）</label>
          <UserSelect
            selectedUsers={selectedMembers}
            onChange={setSelectedMembers}
            disabled={isSubmitting}
            placeholder="ユーザーを検索..."
          />
          <small className="form-hint">
            あとからメンバーを追加することもできます
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
          disabled={isSubmitting || !name.trim()}
        >
          {isSubmitting ? '作成中...' : 'チャンネルを作成'}
        </Button>
      </div>
    </form>
  );
};

export default CreateChannelForm;