# Praseodym

SlackとConfluenceのいいとこどりをしたコミュニケーションプラットフォーム。チャットコミュニケーションと文書管理・共同編集の両方の機能を1つのプラットフォームで提供します。

## 機能

### チャット機能（Slack風）
- リアルタイムメッセージング
- パブリック/プライベートチャンネル
- スレッドによる会話
- メッセージへのリアクション
- メンション機能
- ファイル添付
- ピン留めメッセージ

### ドキュメント機能（Confluence風）
- リッチテキストエディター
- スペース/ページ階層
- バージョン履歴
- コメント/返信機能
- タグ付け
- 共同編集

### その他機能
- リアルタイム通知
- 検索機能
- ユーザー管理
- 権限設定
- ダッシュボード

## 技術スタック

### バックエンド
- Node.js
- Express
- MongoDB (Mongoose)
- Socket.IO
- JWT認証

### フロントエンド
- React
- React Router
- Slate.js (リッチテキストエディター)
- Socket.IO Client
- Axios
- CSS（カスタムスタイル）

## プロジェクト構造

```
project-root/
├── backend/           # バックエンドコード
│   ├── config/        # 設定ファイル
│   ├── controllers/   # APIコントローラー
│   ├── models/        # データモデル
│   ├── routes/        # APIルート
│   ├── middleware/    # ミドルウェア
│   ├── utils/         # ユーティリティ
│   └── server.js      # メインサーバーファイル
│
├── frontend/          # フロントエンドコード
│   ├── public/        # 静的ファイル
│   └── src/           # ソースコード
│       ├── components/  # Reactコンポーネント
│       ├── contexts/    # Reactコンテキスト
│       ├── pages/       # ページコンポーネント
│       ├── utils/       # ユーティリティ関数
│       ├── styles/      # スタイルシート
│       ├── App.jsx      # メインアプリケーション
│       └── index.jsx    # エントリーポイント
│
└── README.md          # プロジェクト説明
```

## インストールと実行方法

### 前提条件
- Node.js (v14以上)
- MongoDB

### バックエンド

```bash
# バックエンドディレクトリに移動
cd backend

# 依存関係のインストール
npm install

# 開発モードで実行
npm run dev

# 本番モードで実行
npm start
```

### フロントエンド

```bash
# フロントエンドディレクトリに移動
cd frontend

# 依存関係のインストール
npm install

# 開発モードで実行
npm run dev

# 本番用ビルド
npm run build
```

## 環境変数

`.env`ファイルをバックエンドディレクトリに作成し、以下の変数を設定してください：

```
# サーバー設定
PORT=5000
NODE_ENV=development

# MongoDB設定
MONGODB_URI=mongodb://localhost:27017/praseodym

# JWT設定
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d

# クライアントURL（CORS用）
CLIENT_URL=http://localhost:5173
```

## API概要

### 認証
- `POST /api/users/register` - ユーザー登録
- `POST /api/users/login` - ログイン
- `POST /api/users/logout` - ログアウト

### ユーザー
- `GET /api/users/me` - 現在のユーザー情報を取得
- `PUT /api/users/me` - ユーザー情報を更新
- `GET /api/users/:id` - 特定のユーザーを取得

### チャンネル
- `POST /api/channels` - チャンネルを作成
- `GET /api/channels` - チャンネル一覧を取得
- `GET /api/channels/:id` - 特定のチャンネルを取得
- `PUT /api/channels/:id` - チャンネルを更新
- `DELETE /api/channels/:id` - チャンネルを削除
- `POST /api/channels/:id/members` - メンバーを追加
- `DELETE /api/channels/:id/members/:userId` - メンバーを削除
- `POST /api/channels/:id/pin/:messageId` - メッセージをピン留め
- `DELETE /api/channels/:id/pin/:messageId` - ピン留めを解除

### メッセージ
- `POST /api/messages` - メッセージを送信
- `GET /api/messages/channel/:channelId` - チャンネルのメッセージを取得
- `GET /api/messages/thread/:threadId` - スレッドのメッセージを取得
- `PUT /api/messages/:id` - メッセージを編集
- `DELETE /api/messages/:id` - メッセージを削除
- `POST /api/messages/:id/reactions` - リアクションを追加

### スペース
- `POST /api/spaces` - スペースを作成
- `GET /api/spaces` - スペース一覧を取得
- `GET /api/spaces/:id` - 特定のスペースを取得
- `GET /api/spaces/key/:key` - キーからスペースを取得
- `PUT /api/spaces/:id` - スペースを更新
- `DELETE /api/spaces/:id` - スペースを削除
- `POST /api/spaces/:id/members` - メンバーを追加
- `DELETE /api/spaces/:id/members/:userId` - メンバーを削除
- `GET /api/spaces/:id/pages` - スペース内のページ一覧を取得

### ページ
- `POST /api/pages` - ページを作成
- `GET /api/pages/:id` - 特定のページを取得
- `PUT /api/pages/:id` - ページを更新
- `DELETE /api/pages/:id` - ページを削除
- `POST /api/pages/:id/comments` - コメントを追加
- `PUT /api/pages/:id/comments/:commentId` - コメントを更新
- `DELETE /api/pages/:id/comments/:commentId` - コメントを削除
- `POST /api/pages/:id/comments/:commentId/replies` - 返信を追加
- `POST /api/pages/:id/restore-version` - バージョンを復元
- `GET /api/pages/recent` - 最近のページを取得
- `GET /api/pages/search` - ページを検索

## ライセンス

MIT