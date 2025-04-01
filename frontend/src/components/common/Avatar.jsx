import React from 'react';

const Avatar = ({ user, size = 'md', className = '', onClick }) => {
  // サイズのクラス名マッピング
  const sizeClass = {
    xs: 'avatar-xs',
    sm: 'avatar-sm',
    md: 'avatar-md',
    lg: 'avatar-lg',
    xl: 'avatar-xl'
  };

  // ユーザーが存在しない場合のデフォルト値
  const displayName = user?.displayName || 'User';
  const avatar = user?.avatar;
  
  // イニシャルの取得（アバター画像がない場合に使用）
  const getInitials = () => {
    if (!displayName) return '?';
    
    const names = displayName.split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  // オンラインステータスに応じたクラス
  const statusClass = user?.status ? `status-${user.status}` : '';

  return (
    <div 
      className={`avatar ${sizeClass[size]} ${statusClass} ${className}`} 
      onClick={onClick}
      title={displayName}
    >
      {avatar ? (
        <img src={avatar} alt={displayName} />
      ) : (
        <div className="avatar-initials">{getInitials()}</div>
      )}
      {user?.status && <span className="status-indicator"></span>}
    </div>
  );
};

export default Avatar;