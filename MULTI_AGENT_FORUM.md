# Multi-Agent Forum 強化実装

## 概要

Multi-Agent Forumを強化し、3つのエージェントが候補者を多角的に評価する討論システムを実装。

## アーキテクチャ

```
User Query
    ↓
Context Analyzer (人生状態を解析)
    ↓
Trajectory Matcher (未来軌道マッチング)
    ↓
Multi-Agent Evaluator (3エージェント並列評価)
    ├─ Problem Agent: 問題の一致度
    ├─ Trajectory Agent: 未来軌道の一致度
    └─ Network Agent: ネットワーク価値
    ↓
Moderator (討論を統合)
    ↓
Synthesizer (最終決定)
    ↓
Result (Top 3 + 根拠)
```

## 実装内容

### 1. Backend: Multi-Agent評価システム

**`backend/agents/trajectory_evaluator.py`**
- 3エージェントが並列で候補者を評価
- 各エージェントが異なる視点でスコアリング
- 最終スコア = Problem(40%) + Trajectory(40%) + Network(20%)

**`backend/forum/orchestrator.py`**
- TrajectoryMatcherとTrajectoryEvaluatorを統合
- グラフモード時に3エージェント討論を実行
- 各エージェントの評価をストリーミング出力

**`backend/agents/synthesizer.py`**
- Moderatorが討論を統合
- 決定根拠を明確化（strongest signals, differentiators, trade-offs）

### 2. Frontend: 討論可視化

**`frontend/components/AgentDebatePanel.tsx`**
- エージェント別メッセージ数を表示
- Moderator/Synthesizerのメッセージを強調表示
- 最新5件 or 全件表示の切り替え

## 使い方

### 環境変数

```bash
USE_GRAPH_MATCHING=true  # グラフモード有効化
```

### 実行

```bash
# Backend
cd backend
python main.py

# Frontend
cd frontend
npm run dev
```

### 動作フロー

1. ユーザーが状況を入力
2. Context Analyzerが人生状態を解析
3. Trajectory Matcherが候補者10人を抽出
4. **Multi-Agent Forum開始**
   - Problem Agent: 各候補の問題一致度を評価
   - Trajectory Agent: 各候補の未来軌道一致度を評価
   - Network Agent: 各候補のネットワーク価値を評価
5. Moderatorが3エージェントの評価を統合
6. Synthesizerが最終Top 3を決定
7. 結果 + 討論ログを返却

## 出力例

```json
{
  "type": "forum",
  "data": {
    "agent": "Problem Agent",
    "content": "Alice Smith: Problem match 0.87",
    "round": 1
  }
}
```

```json
{
  "type": "forum",
  "data": {
    "agent": "Moderator",
    "content": "Alice shows strongest problem alignment (0.87). Bob has superior trajectory match (0.91) but lower network value. Carol offers balanced profile across all dimensions.",
    "round": 1
  }
}
```

```json
{
  "type": "forum",
  "data": {
    "agent": "Synthesizer",
    "content": "SELECTED: Bob Johnson (Score: 0.89) - Problem:0.85 Trajectory:0.91 Network:0.72",
    "round": 2
  }
}
```

## 技術的特徴

### 並列評価
- `asyncio.gather()`で3エージェントを並列実行
- 評価時間を最小化

### スコア統合
- 各エージェントのスコアを重み付け平均
- 最終スコアでソート

### 透明性
- 全エージェントの評価をストリーミング出力
- Moderatorが決定根拠を説明
- UIで討論プロセスを可視化

## 次のステップ

### Phase 2: Human Graph拡張
- Person以外のノード（Project, Company, Research）を追加
- エッジタイプの拡充（inspired_by, learned_from）

### Phase 3: Relationship Layer
- Trust Score（信頼度）
- Help History（支援履歴）
- Thanks Token（感謝トークン）

### Phase 4: Connection Protocol
- AI仲介メッセージ生成
- 最適なタイミング提案
- フォローアップ管理

## 参考

- `TRAJECTORY_MATCHING.md`: 軌道マッチングの詳細
- `GRAPH_README.md`: Human Graphの構造
- `IMPLEMENTATION_SUMMARY.md`: 全体実装サマリー
