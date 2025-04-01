import React, { useRef, useEffect } from 'react';

const Dropdown = ({ children, onClose, className = '' }) => {
  const dropdownRef = useRef(null);

  // モーダル外クリックで閉じる処理 (オプション)
  // Header側で表示・非表示を制御しているため、必須ではないかもしれません
  // useEffect(() => {
  //   const handleClickOutside = (event) => {
  //     if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
  //       if (onClose) {
  //         onClose();
  //       }
  //     }
  //   };

  //   document.addEventListener('mousedown', handleClickOutside);
  //   return () => {
  //     document.removeEventListener('mousedown', handleClickOutside);
  //   };
  // }, [onClose]);

  return (
    <div
      ref={dropdownRef}
      className={`dropdown ${className}`}
      // クリックイベントが親要素に伝播しないようにする
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
};

export default Dropdown;
