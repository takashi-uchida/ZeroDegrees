# Trajectory Matching Engine

**未来軌道マッチング**: 今のあなたではなく、数年後のあなたに近い人を発見する

## コア技術

### 1. Human Knowledge Graph
- **ノード**: Person / Skill / Problem / Goal / Company / Project
- **エッジ**: has_skill / solved_problem / working_on / worked_with / similar_trajectory

### 2. Trajectory Matching Algorithm
```
軌道類似度 = ユーザーの現在の問題 × 候補者が過去に解決した問題
```

**ロジック**:
1. ユーザーの人生状態をembedding化
2. グラフから候補者を抽出
3. 各候補者の軌道を分析（過去の問題 → 現在のスキル → 未来のゴール）
4. 軌道類似度を計算
5. グラフ中心性（影響力）を加味
6. Multi-Agent評価で最終スコアリング

### 3. Multi-Agent Evaluation
3つのエージェントが並列で評価:
- **Agent A**: 問題の一致度（0.4）
- **Agent B**: 未来軌道の一致度（0.4）
- **Agent C**: ネットワーク価値（0.2）

最終スコア = 加重平均

## 使い方

### グラフ構築
```bash
cd backend
python -m graph.trajectory_cli build
```

### 検索
```bash
python -m graph.trajectory_cli search "I want to transition from engineering to product management"
```

### API経由
```bash
# デフォルトでグラフマッチングが有効
curl -X POST http://localhost:8000/api/discover \
  -H "Content-Type: application/json" \
  -d '{"query": "your situation here"}'
```

### 従来モードに切り替え
```bash
export USE_GRAPH_MATCHING=false
```

## 実装ファイル

| ファイル | 役割 |
|---------|------|
| `graph/trajectory.py` | 軌道マッチングアルゴリズム |
| `graph/repository.py` | グラフクエリインターフェース |
| `graph/builder.py` | グラフ構築ロジック |
| `agents/trajectory_evaluator.py` | Multi-Agent評価システム |
| `graph/trajectory_cli.py` | CLIツール |

## アルゴリズム詳細

### 軌道抽出
```python
trajectory = {
    "problems": [過去に解決した問題],
    "skills": [現在持っているスキル],
    "goals": [未来のゴール]
}
```

### 類似度計算
```python
trajectory_score = max(
    cosine_similarity(user_embedding, problem.embedding)
    for problem in candidate.solved_problems
)
```

### グラフ中心性
```python
centrality = min(edge_count / 20.0, 1.0)
```

### 最終スコア
```python
final_score = (
    embedding_distance * 0.3 +
    trajectory_score * 0.5 +
    centrality * 0.2
)
```

## 次のステップ

1. **グラフの拡張**: Company / Project / Research ノードを追加
2. **パス探索**: 2人の間の最短パスを可視化
3. **時系列分析**: 軌道の時間的変化を追跡
4. **関係管理**: Trust Score / Help History / Thanks Token

## 従来システムとの比較

| 要素 | 従来 | Trajectory Matching |
|------|------|---------------------|
| 入力 | 検索クエリ | 人生状態 |
| マッチング | 属性一致 | 未来軌道一致 |
| データ構造 | 人のリスト | Human Graph |
| 推論 | 単一AI | Multi-Agent Forum |
| 出力 | 3人 + メッセージ | 3人 + 軌道分析 + エビデンス |

## テスト

```bash
# グラフ構築
python -m graph.trajectory_cli build

# 検索テスト
python -m graph.trajectory_cli search "I'm a software engineer wanting to start a startup"

# 期待される出力:
# 1. John Doe (future_self)
#    Score: 0.856
#    Problem match: 0.82 | Trajectory match: 0.91 | Network value: 0.75
#    Evidence: Started tech company, Raised seed funding
#    First question: How did you navigate this transition?
```

## パフォーマンス

- グラフ構築: ~5秒（100人）
- 検索: ~2秒（Multi-Agent評価含む）
- メモリ: ~50MB（グラフキャッシュなし）

## 制限事項

- 現在はBFS（幅優先探索）のみ実装
- グラフは起動時に構築（リアルタイム更新なし）
- Multi-Agent評価はLLM依存（コスト注意）
