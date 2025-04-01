import React, { useState, useEffect, useRef } from 'react';

// 絵文字カテゴリー
const CATEGORIES = [
  { id: 'recent', name: '最近使用した絵文字', icon: '🕒' },
  { id: 'smileys', name: '顔文字と感情', icon: '😀' },
  { id: 'people', name: '人とボディ', icon: '👋' },
  { id: 'animals', name: '動物と自然', icon: '🐵' },
  { id: 'food', name: '食べ物と飲み物', icon: '🍎' },
  { id: 'travel', name: '旅行と場所', icon: '🚗' },
  { id: 'activities', name: 'アクティビティ', icon: '⚽' },
  { id: 'objects', name: 'オブジェクト', icon: '💡' },
  { id: 'symbols', name: 'シンボル', icon: '❤️' },
  { id: 'flags', name: '旗', icon: '🏁' }
];

// サンプル絵文字データ（実際の実装では外部ライブラリや完全なデータセットを使用）
const SAMPLE_EMOJIS = {
  smileys: [
    { native: '😀', name: '笑顔', unified: '1F600' },
    { native: '😂', name: '喜びの涙', unified: '1F602' },
    { native: '😍', name: 'ハート目', unified: '1F60D' },
    { native: '🙂', name: '少し笑顔', unified: '1F642' },
    { native: '😊', name: '嬉しい顔', unified: '1F60A' },
    { native: '😎', name: 'サングラス', unified: '1F60E' }
  ],
  people: [
    { native: '👍', name: 'サムズアップ', unified: '1F44D' },
    { native: '👋', name: '手を振る', unified: '1F44B' },
    { native: '👏', name: '拍手', unified: '1F44F' },
    { native: '🙌', name: '両手を上げる', unified: '1F64C' },
    { native: '🤝', name: '握手', unified: '1F91D' },
    { native: '👨‍💻', name: 'プログラマー', unified: '1F468-200D-1F4BB' }
  ],
  animals: [
    { native: '🐶', name: '犬', unified: '1F436' },
    { native: '🐱', name: '猫', unified: '1F431' },
    { native: '🦊', name: 'キツネ', unified: '1F98A' },
    { native: '🐼', name: 'パンダ', unified: '1F43C' },
    { native: '🦁', name: 'ライオン', unified: '1F981' },
    { native: '🐘', name: '象', unified: '1F418' }
  ],
  food: [
    { native: '🍎', name: 'りんご', unified: '1F34E' },
    { native: '🍕', name: 'ピザ', unified: '1F355' },
    { native: '🍣', name: '寿司', unified: '1F363' },
    { native: '🍔', name: 'ハンバーガー', unified: '1F354' },
    { native: '🍩', name: 'ドーナツ', unified: '1F369' },
    { native: '☕', name: 'コーヒー', unified: '2615' }
  ],
  objects: [
    { native: '💻', name: 'ノートパソコン', unified: '1F4BB' },
    { native: '📱', name: 'スマートフォン', unified: '1F4F1' },
    { native: '⌚', name: '腕時計', unified: '231A' },
    { native: '📷', name: 'カメラ', unified: '1F4F7' },
    { native: '💡', name: '電球', unified: '1F4A1' },
    { native: '🔍', name: '虫眼鏡', unified: '1F50D' }
  ],
  symbols: [
    { native: '❤️', name: '赤いハート', unified: '2764-FE0F' },
    { native: '✅', name: '白いチェックマーク', unified: '2705' },
    { native: '⭐', name: '星', unified: '2B50' },
    { native: '⚠️', name: '警告', unified: '26A0-FE0F' },
    { native: '🔴', name: '赤い丸', unified: '1F534' },
    { native: '➕', name: 'プラス', unified: '2795' }
  ]
};

// 最近使用した絵文字を取得
const getRecentEmojis = () => {
  try {
    const recent = localStorage.getItem('recentEmojis');
    return recent ? JSON.parse(recent) : [];
  } catch (err) {
    console.error('最近使用した絵文字の取得に失敗しました:', err);
    return [];
  }
};

// 最近使用した絵文字を保存
const saveRecentEmoji = (emoji) => {
  try {
    const recent = getRecentEmojis();
    
    // 既に存在する場合は削除して先頭に追加
    const filtered = recent.filter(e => e.unified !== emoji.unified);
    const updated = [emoji, ...filtered].slice(0, 20); // 最大20個まで保存
    
    localStorage.setItem('recentEmojis', JSON.stringify(updated));
  } catch (err) {
    console.error('最近使用した絵文字の保存に失敗しました:', err);
  }
};

const EmojiPicker = ({ onSelect }) => {
  const [activeCategory, setActiveCategory] = useState('smileys');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentEmojis, setRecentEmojis] = useState([]);
  const categoryRefs = useRef({});

  // 初期化時に最近使用した絵文字を読み込む
  useEffect(() => {
    setRecentEmojis(getRecentEmojis());
  }, []);

  // 絵文字選択処理
  const handleSelectEmoji = (emoji) => {
    saveRecentEmoji(emoji);
    setRecentEmojis(getRecentEmojis());
    onSelect(emoji);
  };

  // 絵文字検索
  const searchEmojis = () => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    let results = [];
    
    // すべてのカテゴリーから検索
    Object.values(SAMPLE_EMOJIS).forEach(categoryEmojis => {
      const matched = categoryEmojis.filter(
        emoji => emoji.name.toLowerCase().includes(query)
      );
      results = [...results, ...matched];
    });
    
    return results;
  };

  // カテゴリースクロール処理
  const scrollToCategory = (categoryId) => {
    setActiveCategory(categoryId);
    if (categoryRefs.current[categoryId]) {
      categoryRefs.current[categoryId].scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  // 現在のカテゴリーの絵文字を取得
  const getCurrentEmojis = () => {
    if (searchQuery.trim()) {
      return searchEmojis();
    }
    
    if (activeCategory === 'recent') {
      return recentEmojis;
    }
    
    return SAMPLE_EMOJIS[activeCategory] || [];
  };

  const emojisToDisplay = getCurrentEmojis();

  return (
    <div className="emoji-picker">
      <div className="emoji-search">
        <input
          type="text"
          placeholder="絵文字を検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="emoji-categories">
        {CATEGORIES.map(category => (
          <button
            key={category.id}
            className={`category-button ${activeCategory === category.id ? 'active' : ''}`}
            onClick={() => scrollToCategory(category.id)}
            title={category.name}
          >
            {category.icon}
          </button>
        ))}
      </div>
      
      <div className="emoji-content">
        {searchQuery.trim() ? (
          <div className="emoji-search-results">
            <h3 className="category-title">検索結果</h3>
            {emojisToDisplay.length > 0 ? (
              <div className="emoji-grid">
                {emojisToDisplay.map(emoji => (
                  <button
                    key={emoji.unified}
                    className="emoji-item"
                    onClick={() => handleSelectEmoji(emoji)}
                    title={emoji.name}
                  >
                    {emoji.native}
                  </button>
                ))}
              </div>
            ) : (
              <div className="no-results">一致する絵文字がありません</div>
            )}
          </div>
        ) : (
          <div className="emoji-categories-content">
            {CATEGORIES.map(category => (
              <div
                key={category.id}
                ref={el => (categoryRefs.current[category.id] = el)}
                className="emoji-category"
              >
                <h3 className="category-title">{category.name}</h3>
                <div className="emoji-grid">
                  {(category.id === 'recent' ? recentEmojis : SAMPLE_EMOJIS[category.id] || []).map(
                    emoji => (
                      <button
                        key={emoji.unified}
                        className="emoji-item"
                        onClick={() => handleSelectEmoji(emoji)}
                        title={emoji.name}
                      >
                        {emoji.native}
                      </button>
                    )
                  )}
                  
                  {category.id === 'recent' && recentEmojis.length === 0 && (
                    <div className="no-results">最近使用した絵文字はありません</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmojiPicker;