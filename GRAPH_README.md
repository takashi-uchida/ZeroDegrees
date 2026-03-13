# HumanGraph

人類のナレッジグラフ探索エンジン

## アーキテクチャ

```
User Query
    ↓
Context AI (人生状態の解析)
    ↓
Destiny Engine (運命探索)
    ↓
Human Graph (人・スキル・問題・ゴールのネットワーク)
    ↓
Trajectory Matching (未来軌道の一致)
    ↓
Multi-Agent Forum (討論による最終候補決定)
    ↓
Result (3人 + 推論 + 次の行動)
```

## グラフ構造

### ノードタイプ
- **Person**: 人
- **Skill**: スキル
- **Problem**: 解決した問題
- **Goal**: 取り組んでいるゴール
- **Company**: 会社（未実装）
- **Project**: プロジェクト（未実装）

### エッジタイプ
- **has_skill**: Person → Skill
- **solved_problem**: Person → Problem
- **working_on**: Person → Goal
- **similar_trajectory**: Person → Person（未実装）
- **future_self**: Person → Person（未実装）

## セットアップ

### 1. データベースマイグレーション

```bash
cd backend
python -c "from db.session import init_db; import asyncio; asyncio.run(init_db())"
```

### 2. サンプルデータの投入

```bash
python -c "from db.seed import seed_database; import asyncio; asyncio.run(seed_database())"
```

### 3. グラフの構築

```bash
python -m graph.cli build
```

### 4. 軌道マッチングのテスト

```bash
python -m graph.cli query "I'm a non-technical founder looking for a CTO"
```

## 使い方

### グラフモードの有効化

`.env` に以下を追加:

```
USE_GRAPH_MATCHING=true
```

### 従来モード（類似度検索）

```
USE_GRAPH_MATCHING=false
```

## 次のステップ

1. **Trajectory Matching の強化**
   - 現在: 問題の類似度のみ
   - 改善: スキル獲得パス、時間軸、成功確率

2. **Multi-Agent Forum の実装**
   - Agent A: 問題一致
   - Agent B: 未来一致
   - Agent C: ネットワーク距離

3. **グラフの拡張**
   - Company / Project ノードの追加
   - similar_trajectory / future_self エッジの自動生成

4. **Relationship Layer**
   - Trust Score
   - Help History
   - Thanks Token

## 技術スタック

- **Backend**: FastAPI + SQLAlchemy + pgvector
- **Database**: PostgreSQL + pgvector extension
- **AI**: OpenAI Embeddings (text-embedding-3-small)
- **Graph**: カスタム実装（将来的にNeo4jも検討）
