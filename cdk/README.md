# ZeroDegrees AWS CDK Infrastructure

このディレクトリには、ZeroDegreesアプリケーションをAWSにデプロイするためのCDKコードが含まれています。

## アーキテクチャ

- **VPC**: 2つのAZにまたがるVPC（NATゲートウェイ1つ）
- **RDS PostgreSQL 16**: pgvectorサポート（T4g.micro、20GB〜100GB自動拡張）
- **ECS Fargate**: FastAPIバックエンド（ALB経由）
- **S3 + CloudFront**: Next.jsフロントエンド（静的エクスポート）
- **Secrets Manager**: データベース認証情報とAPIキー

## 前提条件

1. AWS CLIとCDKのインストール
```bash
npm install -g aws-cdk
```

2. AWS認証情報の設定
```bash
aws configure
```

3. フロントエンドのビルド
```bash
cd ../frontend
npm install
npm run build
```

## デプロイ手順

### 1. CDK Bootstrap（初回のみ）
```bash
cd cdk
cdk bootstrap
```

### 2. APIキーの設定

デプロイ後、Secrets ManagerでAPIキーを設定：

```bash
# APIキーシークレットのARNを取得
aws cloudformation describe-stacks \
  --stack-name ZeroDegreesStack \
  --query 'Stacks[0].Outputs[?OutputKey==`APIKeysSecretArn`].OutputValue' \
  --output text

# シークレットを更新
aws secretsmanager update-secret \
  --secret-id <APIKeysSecretArn> \
  --secret-string '{"OPENAI_API_KEY":"sk-...","ANTHROPIC_API_KEY":"sk-ant-..."}'
```

### 3. デプロイ
```bash
npm run build
cdk deploy
```

### 4. データベース初期化

バックエンドコンテナに接続してデータベースをセットアップ：

```bash
# ECSタスクIDを取得
aws ecs list-tasks --cluster ZeroDegreesStack-ClusterXXX --query 'taskArns[0]' --output text

# ECS Execで接続
aws ecs execute-command \
  --cluster ZeroDegreesStack-ClusterXXX \
  --task <task-id> \
  --container web \
  --interactive \
  --command "/bin/bash"

# コンテナ内で実行
python -m db.seed
```

## 出力

デプロイ後、以下の情報が出力されます：

- `BackendURL`: バックエンドAPIのURL
- `FrontendURL`: CloudFrontディストリビューションのURL
- `DBSecretArn`: データベース認証情報のシークレットARN
- `APIKeysSecretArn`: APIキーのシークレットARN

## コスト見積もり

月額概算（東京リージョン）：

- RDS T4g.micro: ~$15
- ECS Fargate (0.5 vCPU, 1GB): ~$15
- NAT Gateway: ~$35
- ALB: ~$20
- CloudFront + S3: ~$1-5（トラフィック次第）

**合計: 約$86-90/月**

## カスタマイズ

### 本番環境向け設定

`lib/stack.ts`を編集：

- RDSインスタンスタイプを変更（例: `T4G.SMALL`）
- ECSタスク数を増やす（`desiredCount: 2`）
- Multi-AZ RDSを有効化（`multiAz: true`）
- バックアップ保持期間を設定（`backupRetention: cdk.Duration.days(7)`）

### カスタムドメイン

Route 53とACMを追加：

```typescript
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';

const certificate = new acm.Certificate(this, 'Certificate', {
  domainName: 'zerodegrees.example.com',
  validation: acm.CertificateValidation.fromDns(),
});

// CloudFrontとALBに証明書を適用
```

## トラブルシューティング

### pgvectorが見つからない

RDSインスタンスに接続してpgvectorをインストール：

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### ECSタスクが起動しない

CloudWatch Logsでエラーを確認：

```bash
aws logs tail /ecs/ZeroDegreesStack-Backend --follow
```

## クリーンアップ

```bash
cdk destroy
```

注意: RDSはスナップショットが作成されます。完全に削除する場合は手動でスナップショットを削除してください。
