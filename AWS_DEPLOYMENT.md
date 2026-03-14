# AWS Deployment Guide

## アーキテクチャ概要

```
┌─────────────┐
│ CloudFront  │ ← フロントエンド（Next.js静的サイト）
└──────┬──────┘
       │
┌──────▼──────┐
│     S3      │
└─────────────┘

┌─────────────┐
│     ALB     │ ← バックエンド（FastAPI）
└──────┬──────┘
       │
┌──────▼──────┐
│ ECS Fargate │
└──────┬──────┘
       │
┌──────▼──────┐
│ RDS Postgres│ ← pgvector対応
└─────────────┘
```

## デプロイ手順

### 1. 前提条件

- AWS CLI設定済み
- Node.js 20+
- Docker（ローカルテスト用）

### 2. 初回デプロイ

```bash
./deploy.sh
```

### 3. APIキーの設定

```bash
./setup-secrets.sh
```

### 4. データベース初期化

```bash
./init-db.sh
```

### 5. フロントエンドURLの更新

デプロイ後に出力されるCloudFront URLをバックエンドの環境変数に設定：

```bash
# スタックを更新
cd cdk
# lib/stack.tsのFRONTEND_URLを実際のCloudFront URLに変更
cdk deploy
```

## コスト最適化

### 開発環境

- RDS: T4g.micro（$15/月）
- ECS: 0.5 vCPU, 1GB（$15/月）
- NAT Gateway: 1つ（$35/月）

**合計: 約$90/月**

### 本番環境

- RDS: T4g.small + Multi-AZ（$60/月）
- ECS: 1 vCPU, 2GB × 2タスク（$60/月）
- NAT Gateway: 2つ（$70/月）

**合計: 約$200/月**

## トラブルシューティング

### pgvectorが見つからない

RDSに接続してエクステンションをインストール：

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### ECSタスクが起動しない

ログを確認：

```bash
aws logs tail /ecs/ZeroDegreesStack-Backend --follow
```

### フロントエンドが表示されない

CloudFrontのキャッシュをクリア：

```bash
aws cloudfront create-invalidation \
  --distribution-id <distribution-id> \
  --paths "/*"
```

## 削除

```bash
cd cdk
cdk destroy
```

注意: RDSスナップショットは手動で削除する必要があります。

## 詳細

詳細なドキュメントは `cdk/README.md` を参照してください。
