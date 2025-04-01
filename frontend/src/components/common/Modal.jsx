import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Button from './Button';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  footer = null,
  closeOnClickOutside = true,
  closeOnEsc = true,
  className = ''
}) => {
  const modalRef = useRef(null);

  // モーダルサイズのクラス名マッピング
  const sizeClass = {
    sm: 'modal-sm',
    md: 'modal-md',
    lg: 'modal-lg',
    xl: 'modal-xl',
    full: 'modal-full'
  };

  // ESCキーでモーダルを閉じる
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (closeOnEsc && event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // スクロールを無効化
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = ''; // スクロールを元に戻す
    };
  }, [isOpen, onClose, closeOnEsc]);

  // モーダル外のクリックを処理
  const handleClickOutside = (event) => {
    if (closeOnClickOutside && modalRef.current && !modalRef.current.contains(event.target)) {
      onClose();
    }
  };

  // モーダルが開いていなければ何も表示しない
  if (!isOpen) return null;

  // モーダルのDOM構造
  const modalContent = (
    <div className="modal-overlay" onClick={handleClickOutside}>
      <div 
        className={`modal ${sizeClass[size] || 'modal-md'} ${className}`}
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        
        <div className="modal-body">
          {children}
        </div>
        
        {footer !== null ? (
          <div className="modal-footer">
            {footer}
          </div>
        ) : (
          <div className="modal-footer">
            <Button variant="secondary" onClick={onClose}>
              閉じる
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  // モーダルをbody直下に描画
  return createPortal(modalContent, document.body);
};

export default Modal;