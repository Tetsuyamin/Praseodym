import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import Modal from '../common/Modal';
import UserSelect from '../common/UserSelect';
import api from '../../utils/api';

const ChannelInfo = ({ channel }) => {
  const { user } = useAuth();
  const { fetchChannels } = useApp();
  
  const [showDetails, setShowDetails] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 編集用ステート
  const [name, setName] = useState(channel ? channel.name : '');
  const [description, setDescription] = useState(channel ? channel.description : '');
  const [isPrivate, setIsPrivate] = useState(channel ? channel.isPrivate : false);

  // チャンネル編集
  const handleUpdateChannel = async () => {
    try {
      setIsSubmitting(true);
      
      await api.put(`/api/channels/${channel._id}`, {
        name,
        description,
        isPrivate
      });
      
      // チャンネル一覧を再取得
      await fetchChannels();
      
      setShowEditModal(false);
    } catch (err) {
      console.error('チャンネル更新エラー:', err);
      alert('チャンネルの更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // メンバー追加
  const handleAddMember = async () => {
    if (!selectedUser.length) return;
    
    try {
      setIsSubmitting(true);
      
      await api.post(`/api/channels/${channel._id}/members`, {
        userId: selectedUser[0]._id
      });
      
      // チャンネル一覧を再取得
      await fetchChannels();
      
      setSelectedUser([]);
    } catch (err) {
      console.error('メンバー追加エラー:', err);
      alert('メンバーの追加に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // メンバー削除
  const handleRemoveMember = async (userId) => {
    try {
      await api.delete(`/api/channels/${channel._id}/members/${userId}`);
      
      // チャンネル一覧を再取得
      await fetchChannels();
    } catch (err) {
      console.error('メンバー削除エラー:', err);
      alert('メンバーの削除に失敗しました');
    }
  };

  // 編集権限の確認
  const canEdit = () => {
    if (!channel || !user) return false;
    
    // 作成者またはメンバーは編集可能
    return (
      channel.createdBy._id === user.id ||
      user.role === 'admin'
    );
  };

  // チャンネル詳細トグル
  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  if (!channel) return null;

  return (
    <div className="channel-info">
      <div className="channel-basic-info">
        <h2 className="channel-name">
          <span className="channel-icon">{channel.isPrivate ? '🔒' : '#'} {channel.name}
          </span>
        </h2>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleDetails}
        >
          {showDetails ? '詳細を隠す' : '詳細を表示'}
        </Button>
      </div>
      
      {showDetails && (
        <div className="channel-details">
          {channel.description && (
            <div className="channel-description">
              {channel.description}
            </div>
          )}
          
          <div className="channel-meta">
            <div className="channel-members-count">
              <span className="meta-label">メンバー:</span>
              <Button
                variant="link"
                size="sm"
                onClick={() => setShowMembersModal(true)}
              >
                {channel.members.length}人
              </Button>
            </div>
            
            <div className="channel-created">
              <span className="meta-label">作成者:</span>
              <span className="meta-value">{channel.createdBy.displayName}</span>
            </div>
            
            <div className="channel-created-date">
              <span className="meta-label">作成日:</span>
              <span className="meta-value">
                {new Date(channel.createdAt).toLocaleDateString()}
              </span>
            </div>
            
            {canEdit() && (
              <div className="channel-actions">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setName(channel.name);
                    setDescription(channel.description);
                    setIsPrivate(channel.isPrivate);
                    setShowEditModal(true);
                  }}
                >
                  チャンネル設定
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* メンバー一覧モーダル */}
      <Modal
        isOpen={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        title={`#${channel.name} のメンバー`}
      >
        <div className="members-modal-content">
          {channel.isPrivate && canEdit() && (
            <div className="add-member-form">
              <h4>メンバーを追加</h4>
              <div className="add-member-input">
                <UserSelect
                  selectedUsers={selectedUser}
                  onChange={setSelectedUser}
                  multiple={false}
                  placeholder="ユーザーを検索..."
                />
                
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAddMember}
                  disabled={isSubmitting || !selectedUser.length}
                >
                  追加
                </Button>
              </div>
            </div>
          )}
          
          <div className="members-list">
            <h4>メンバー一覧 ({channel.members.length}人)</h4>
            
            <ul className="member-items">
              {channel.members.map(member => (
                <li key={member._id} className="member-item">
                  <div className="member-info">
                    <Avatar user={member} size="sm" />
                    <div className="member-name">
                      <div className="member-display-name">{member.displayName}</div>
                      <div className="member-username">@{member.username}</div>
                    </div>
                  </div>
                  
                  {canEdit() && member._id !== channel.createdBy._id && member._id !== user.id && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemoveMember(member._id)}
                    >
                      削除
                    </Button>
                  )}
                  
                  {member._id === channel.createdBy._id && (
                    <div className="member-badge creator">作成者</div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Modal>
      
      {/* チャンネル編集モーダル */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="チャンネル設定"
      >
        <div className="edit-channel-form">
          <div className="form-group">
            <label htmlFor="channel-name">チャンネル名</label>
            <div className="channel-name-input">
              <span className="channel-prefix">#</span>
              <input
                type="text"
                id="channel-name"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase())}
                placeholder="チャンネル名"
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="channel-description">説明（任意）</label>
            <textarea
              id="channel-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="このチャンネルの目的を入力してください"
              rows="3"
              disabled={isSubmitting}
            />
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
                プライベートチャンネル
              </label>
            </div>
            <small className="form-hint">
              {isPrivate
                ? 'このチャンネルは招待されたメンバーのみが参加できます。'
                : 'このチャンネルは誰でも参加できます。'}
            </small>
          </div>
          
          <div className="form-actions">
            <Button
              variant="secondary"
              onClick={() => setShowEditModal(false)}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
            
            <Button
              variant="primary"
              onClick={handleUpdateChannel}
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? '更新中...' : '保存'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ChannelInfo;