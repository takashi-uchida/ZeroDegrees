# Relationship Layer Implementation

## Overview
Relationship Layerは、人と人の関係性を管理し、信頼スコア・助け合いの履歴・感謝トークンを追跡するシステムです。

## Core Components

### 1. Trust Score（信頼スコア）
- 関係性の強さを数値化（0.0〜）
- Help Historyで+0.1 × impact_score
- Thanks Tokenで+0.05 × amount

### 2. Help History（助け合い履歴）
- 誰が誰を助けたかの記録
- impact_score: 助けの影響度（デフォルト1.0）
- 自動的にTrust Scoreを更新

### 3. Thanks Token（感謝トークン）
- Help Historyに対する感謝の表明
- amount: トークン数（デフォルト1）
- message: 感謝メッセージ（任意）

## Database Schema

```sql
-- 関係性テーブル
relationships
  - id: UUID
  - person_a_id: UUID (FK to people)
  - person_b_id: UUID (FK to people)
  - trust_score: Float (default 0.0)
  - created_at: DateTime
  - updated_at: DateTime

-- 助け合い履歴
help_history
  - id: UUID
  - relationship_id: UUID (FK to relationships)
  - helper_id: UUID (FK to people)
  - helped_id: UUID (FK to people)
  - description: Text
  - impact_score: Float (default 1.0)
  - created_at: DateTime

-- 感謝トークン
thanks_tokens
  - id: UUID
  - help_history_id: UUID (FK to help_history)
  - from_person_id: UUID (FK to people)
  - to_person_id: UUID (FK to people)
  - amount: Integer (default 1)
  - message: Text (nullable)
  - created_at: DateTime
```

## API Endpoints

### POST /api/relationships/help
助け合いを記録
```json
{
  "helper_id": "uuid",
  "helped_id": "uuid",
  "description": "問題解決を手伝った",
  "impact_score": 1.5
}
```

### POST /api/relationships/thanks
感謝トークンを送る
```json
{
  "from_person_id": "uuid",
  "to_person_id": "uuid",
  "help_history_id": "uuid",
  "amount": 3,
  "message": "本当に助かりました"
}
```

### GET /api/relationships/{person_a_id}/{person_b_id}/trust
信頼スコアを取得

### GET /api/relationships/{person_a_id}/{person_b_id}/history
助け合い履歴を取得

## Usage Example

```python
from services.relationship_repository import RelationshipRepository

repo = RelationshipRepository(db)

# 助け合いを記録
help = repo.add_help(
    helper_id=alice_id,
    helped_id=bob_id,
    description="起業の相談に乗った",
    impact_score=2.0
)

# 感謝トークンを送る
token = repo.send_thanks(
    from_person_id=bob_id,
    to_person_id=alice_id,
    help_history_id=help.id,
    amount=5,
    message="アドバイスのおかげで成功しました"
)

# 信頼スコアを確認
score = repo.get_trust_score(alice_id, bob_id)
print(f"Trust Score: {score}")  # 2.0 * 0.1 + 5 * 0.05 = 0.45
```

## Next Steps

1. **UI Integration**: フロントエンドに関係性可視化を追加
2. **Decay Function**: 時間経過でTrust Scoreを減衰
3. **Network Effects**: 共通の友人による信頼スコアブースト
4. **Reputation System**: 全体的な評判スコアの計算
