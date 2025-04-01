import React, { useState, useRef } from 'react';
import { formatFileSize } from '../../utils/helpers';
import Button from './Button';

// 許可されるファイルタイプと最大サイズ（バイト単位）
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = {
  'image/jpeg': true,
  'image/png': true,
  'image/gif': true,
  'image/svg+xml': true,
  'application/pdf': true,
  'application/msword': true,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
  'application/vnd.ms-excel': true,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': true,
  'application/vnd.ms-powerpoint': true,
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': true,
  'text/plain': true,
  'text/csv': true,
  'application/zip': true,
  'application/x-zip-compressed': true
};

const FileUpload = ({ onSelect, multiple = true, maxFiles = 5 }) => {
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef(null);

  // ファイルの追加
  const addFiles = (newFiles) => {
    // 選択を処理
    const newFilesArray = Array.from(newFiles);
    const newValidFiles = [];
    const newErrors = [];
    
    // 最大ファイル数チェック
    if (files.length + newFilesArray.length > maxFiles) {
      newErrors.push(`最大${maxFiles}個のファイルまでアップロードできます`);
      // 最大数まで追加
      newFilesArray.splice(maxFiles - files.length);
    }
    
    // ファイルタイプとサイズのバリデーション
    newFilesArray.forEach(file => {
      // ファイルタイプチェック
      if (!ALLOWED_TYPES[file.type]) {
        newErrors.push(`${file.name}: サポートされていないファイル形式です`);
        return;
      }
      
      // ファイルサイズチェック
      if (file.size > MAX_FILE_SIZE) {
        newErrors.push(`${file.name}: ファイルサイズが大きすぎます（最大${formatFileSize(MAX_FILE_SIZE)}）`);
        return;
      }
      
      // プレビュー用URLを追加
      if (file.type.startsWith('image/')) {
        file.previewUrl = URL.createObjectURL(file);
      }
      
      newValidFiles.push(file);
    });
    
    // 単一ファイルモードの場合は前のファイルを削除
    const updatedFiles = multiple ? [...files, ...newValidFiles] : newValidFiles;
    
    setFiles(updatedFiles);
    setErrors(newErrors);
    
    // 親コンポーネントに通知
    if (newValidFiles.length > 0 && onSelect) {
      onSelect(updatedFiles);
    }
  };

  // ファイルの削除
  const removeFile = (index) => {
    const updatedFiles = [...files];
    
    // 画像プレビューのURLオブジェクトを解放
    if (updatedFiles[index].previewUrl) {
      URL.revokeObjectURL(updatedFiles[index].previewUrl);
    }
    
    updatedFiles.splice(index, 1);
    setFiles(updatedFiles);
    
    // 親コンポーネントに通知
    if (onSelect) {
      onSelect(updatedFiles);
    }
  };

  // ファイル選択ダイアログを開く
  const openFileDialog = () => {
    fileInputRef.current.click();
  };

  // ファイル選択ハンドラー
  const handleFileChange = (e) => {
    addFiles(e.target.files);
    // 同じファイルを再度選択できるようにする
    e.target.value = '';
  };

  // ドラッグ&ドロップハンドラー
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  // ファイルタイプからアイコンを取得
  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📑';
    if (fileType.includes('zip')) return '🗜️';
    if (fileType.includes('text') || fileType.includes('csv')) return '📰';
    return '📎';
  };

  return (
    <div className="file-upload">
      {/* エラーメッセージ */}
      {errors.length > 0 && (
        <div className="file-errors">
          {errors.map((error, index) => (
            <div key={index} className="file-error">
              {error}
            </div>
          ))}
        </div>
      )}
      
      {/* ドロップエリア */}
      <div
        className={`drop-area ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple={multiple}
          style={{ display: 'none' }}
        />
        
        <div className="drop-message">
          <div className="drop-icon">📁</div>
          <div className="drop-text">
            ファイルをドラッグ&ドロップ<br />
            または<br />
            クリックして選択
          </div>
          <div className="drop-info">
            最大{formatFileSize(MAX_FILE_SIZE)}、{maxFiles}ファイルまで
          </div>
        </div>
      </div>
      
      {/* ファイルリスト */}
      {files.length > 0 && (
        <div className="file-list">
          {files.map((file, index) => (
            <div key={index} className="file-item">
              {file.previewUrl ? (
                <div className="file-preview">
                  <img src={file.previewUrl} alt={file.name} />
                </div>
              ) : (
                <div className="file-icon">
                  {getFileIcon(file.type)}
                </div>
              )}
              
              <div className="file-info">
                <div className="file-name" title={file.name}>
                  {file.name}
                </div>
                <div className="file-size">
                  {formatFileSize(file.size)}
                </div>
              </div>
              
              <button
                type="button"
                className="remove-file"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* アクションボタン */}
      <div className="file-actions">
        <Button
          variant="secondary"
          size="sm"
          onClick={openFileDialog}
        >
          ファイルを追加
        </Button>
        
        {files.length > 0 && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              // すべてのプレビューURLを解放
              files.forEach(file => {
                if (file.previewUrl) {
                  URL.revokeObjectURL(file.previewUrl);
                }
              });
              
              setFiles([]);
              if (onSelect) {
                onSelect([]);
              }
            }}
          >
            すべて削除
          </Button>
        )}
      </div>
    </div>
  );
};

export default FileUpload;