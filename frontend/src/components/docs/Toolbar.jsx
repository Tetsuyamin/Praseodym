import React from 'react';
import { useSlate } from 'slate-react';
import { Editor, Transforms, Element as SlateElement, Text } from 'slate';

// フォーマットのアクティブ状態を確認する
const isMarkActive = (editor, format) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};

// ブロックのアクティブ状態を確認する
const isBlockActive = (editor, format) => {
  const [match] = Editor.nodes(editor, {
    match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format
  });
  
  return !!match;
};

// マークを切り替える
const toggleMark = (editor, format) => {
  const isActive = isMarkActive(editor, format);
  
  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

// ブロックを切り替える
const toggleBlock = (editor, format) => {
  const isActive = isBlockActive(editor, format);
  
  Transforms.setNodes(
    editor,
    {
      type: isActive ? 'paragraph' : format
    },
    { match: n => Editor.isBlock(editor, n) }
  );
};

// リストを切り替える
const toggleList = (editor, format) => {
  const isActive = isBlockActive(editor, format);
  
  Transforms.unwrapNodes(editor, {
    match: n => ['bulleted-list', 'numbered-list'].includes(n.type),
    split: true
  });
  
  Transforms.setNodes(editor, {
    type: isActive ? 'paragraph' : 'list-item'
  });
  
  if (!isActive) {
    const block = { type: format, children: [] };
    Transforms.wrapNodes(editor, block);
  }
};

// リンクを挿入する
const insertLink = (editor, url) => {
  if (!url) return;
  
  const { selection } = editor;
  const isCollapsed = selection && Range.isCollapsed(selection);
  
  const link = {
    type: 'link',
    url,
    children: isCollapsed ? [{ text: url }] : []
  };
  
  if (isCollapsed) {
    Transforms.insertNodes(editor, link);
  } else {
    Transforms.wrapNodes(editor, link, { split: true });
    Transforms.collapse(editor, { edge: 'end' });
  }
};

// ツールバーボタンコンポーネント
const ToolbarButton = ({ format, icon, active, onMouseDown }) => {
  return (
    <button
      className={`toolbar-button ${active ? 'active' : ''}`}
      onMouseDown={onMouseDown}
      title={format}
    >
      {icon}
    </button>
  );
};

// ツールバーセパレーターコンポーネント
const ToolbarSeparator = () => {
  return <div className="toolbar-separator" />;
};

const Toolbar = () => {
  const editor = useSlate();
  
  // マークボタンのリスト
  const markButtons = [
    { format: 'bold', icon: 'B' },
    { format: 'italic', icon: 'I' },
    { format: 'underline', icon: 'U' },
    { format: 'code', icon: '</>' },
    { format: 'strikethrough', icon: 'S' }
  ];
  
  // ブロックボタンのリスト
  const blockButtons = [
    { format: 'heading-one', icon: 'H1' },
    { format: 'heading-two', icon: 'H2' },
    { format: 'heading-three', icon: 'H3' },
    { format: 'block-quote', icon: '"' }
  ];
  
  // リストボタンのリスト
  const listButtons = [
    { format: 'bulleted-list', icon: '•' },
    { format: 'numbered-list', icon: '1.' }
  ];
  
  // リンク挿入処理
  const handleInsertLink = () => {
    const url = window.prompt('リンクURLを入力してください:');
    if (url) {
      insertLink(editor, url);
    }
  };
  
  // 画像挿入処理
  const handleInsertImage = () => {
    const url = window.prompt('画像URLを入力してください:');
    if (url) {
      insertImage(editor, url);
    }
  };
  
  // 画像を挿入する
  const insertImage = (editor, url) => {
    const image = {
      type: 'image',
      url,
      children: [{ text: '' }]
    };
    
    Transforms.insertNodes(editor, image);
  };
  
  // テーブル挿入処理
  const handleInsertTable = () => {
    const rows = parseInt(window.prompt('行数を入力してください:', '3')) || 3;
    const cols = parseInt(window.prompt('列数を入力してください:', '3')) || 3;
    
    const cells = Array(cols).fill(0).map(() => ({
      type: 'table-cell',
      children: [{ type: 'paragraph', children: [{ text: '' }] }]
    }));
    
    const rows_array = Array(rows).fill(0).map(() => ({
      type: 'table-row',
      children: [...cells]
    }));
    
    const table = {
      type: 'table',
      children: rows_array
    };
    
    Transforms.insertNodes(editor, table);
  };

  return (
    <div className="editor-toolbar">
      {/* マークボタン */}
      <div className="toolbar-group">
        {markButtons.map(button => (
          <ToolbarButton
            key={button.format}
            format={button.format}
            icon={button.icon}
            active={isMarkActive(editor, button.format)}
            onMouseDown={event => {
              event.preventDefault();
              toggleMark(editor, button.format);
            }}
          />
        ))}
      </div>
      
      <ToolbarSeparator />
      
      {/* ブロックボタン */}
      <div className="toolbar-group">
        {blockButtons.map(button => (
          <ToolbarButton
            key={button.format}
            format={button.format}
            icon={button.icon}
            active={isBlockActive(editor, button.format)}
            onMouseDown={event => {
              event.preventDefault();
              toggleBlock(editor, button.format);
            }}
          />
        ))}
      </div>
      
      <ToolbarSeparator />
      
      {/* リストボタン */}
      <div className="toolbar-group">
        {listButtons.map(button => (
          <ToolbarButton
            key={button.format}
            format={button.format}
            icon={button.icon}
            active={isBlockActive(editor, button.format)}
            onMouseDown={event => {
              event.preventDefault();
              toggleList(editor, button.format);
            }}
          />
        ))}
      </div>
      
      <ToolbarSeparator />
      
      {/* リンク、画像、テーブル */}
      <div className="toolbar-group">
        <ToolbarButton
          format="link"
          icon="🔗"
          active={isBlockActive(editor, 'link')}
          onMouseDown={event => {
            event.preventDefault();
            handleInsertLink();
          }}
        />
        
        <ToolbarButton
          format="image"
          icon="🖼️"
          active={false}
          onMouseDown={event => {
            event.preventDefault();
            handleInsertImage();
          }}
        />
        
        <ToolbarButton
          format="table"
          icon="📊"
          active={false}
          onMouseDown={event => {
            event.preventDefault();
            handleInsertTable();
          }}
        />
      </div>
    </div>
  );
};

export default Toolbar;