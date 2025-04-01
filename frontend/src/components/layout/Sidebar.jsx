import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import ChannelList from '../chat/ChannelList';
import SpaceList from '../docs/SpaceList';
import Modal from '../common/Modal';
import Button from '../common/Button';
import CreateChannelForm from '../chat/CreateChannelForm';
import CreateSpaceForm from '../docs/CreateSpaceForm';

const Sidebar = () => {
  const { user } = useAuth();
  const { channels, spaces } = useApp();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' または 'docs'
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [showCreateSpaceModal, setShowCreateSpaceModal] = useState(false);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleCreateChannel = () => {
    setShowCreateChannelModal(true);
  };

  const handleCreateSpace = () => {
    setShowCreateSpaceModal(true);
  };

  const handleChannelCreated = (channel) => {
    setShowCreateChannelModal(false);
    navigate(`/channel/${channel._id}`);
  };

  const handleSpaceCreated = (space) => {
    setShowCreateSpaceModal(false);
    navigate(`/space/${space.key}`);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="app-logo">Praseodym</h1>
        <div className="user-info">
          <img src={user?.avatar} alt={user?.displayName} className="avatar avatar-sm" />
          <span className="user-name">{user?.displayName}</span>
        </div>
      </div>

      <div className="sidebar-tabs">
        <button
          className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => handleTabChange('chat')}
        >
          チャット
        </button>
        <button
          className={`tab-button ${activeTab === 'docs' ? 'active' : ''}`}
          onClick={() => handleTabChange('docs')}
        >
          ドキュメント
        </button>
      </div>

      <div className="sidebar-content">
        {activeTab === 'chat' ? (
          <div className="channel-section">
            <div className="section-header">
              <h2>チャンネル</h2>
              <button className="add-button" onClick={handleCreateChannel}>+</button>
            </div>
            <ChannelList channels={channels} />
          </div>
        ) : (
          <div className="space-section">
            <div className="section-header">
              <h2>スペース</h2>
              <button className="add-button" onClick={handleCreateSpace}>+</button>
            </div>
            <SpaceList spaces={spaces} />
          </div>
        )}
      </div>

      <div className="sidebar-footer">
        <Link to="/dashboard" className="dashboard-link">
          ダッシュボード
        </Link>
      </div>

      {/* チャンネル作成モーダル */}
      <Modal
        isOpen={showCreateChannelModal}
        onClose={() => setShowCreateChannelModal(false)}
        title="新しいチャンネルを作成"
      >
        <CreateChannelForm onSuccess={handleChannelCreated} />
      </Modal>

      {/* スペース作成モーダル */}
      <Modal
        isOpen={showCreateSpaceModal}
        onClose={() => setShowCreateSpaceModal(false)}
        title="新しいスペースを作成"
      >
        <CreateSpaceForm onSuccess={handleSpaceCreated} />
      </Modal>
    </aside>
  );
};

export default Sidebar;