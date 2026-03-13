from typing import List, Dict
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from db.models import GraphNode, GraphEdge
from graph.schema import NodeType, EdgeType


class TrajectoryMatcher:
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def find_future_selves(self, user_embedding: List[float], limit: int = 3) -> List[Dict]:
        """
        ユーザーの現在地から「未来の自分」を発見
        
        ロジック:
        1. ユーザーが解決したい問題を持つ人を探す
        2. その人が今持っているスキル・ゴールを見る
        3. 軌道の類似度でランク付け
        """
        from pgvector.sqlalchemy import Vector
        
        # 問題ノードとの類似度でPersonを探す
        stmt = select(
            GraphNode,
            func.cosine_distance(GraphNode.embedding, func.cast(user_embedding, Vector(1536))).label("distance")
        ).where(
            GraphNode.node_type == NodeType.PERSON
        ).order_by("distance").limit(limit * 3)
        
        result = await self.session.execute(stmt)
        candidates = result.all()
        
        # 各候補のグラフ構造を取得してスコアリング
        scored = []
        for node, distance in candidates:
            trajectory_score = await self._calculate_trajectory_score(node, user_embedding)
            scored.append({
                "person": node,
                "distance": distance,
                "trajectory_score": trajectory_score,
                "final_score": (1 - distance) * 0.5 + trajectory_score * 0.5
            })
        
        scored.sort(key=lambda x: x["final_score"], reverse=True)
        return scored[:limit]
    
    async def _calculate_trajectory_score(self, person_node: GraphNode, user_embedding: List[float]) -> float:
        """
        軌道スコア = その人が解決した問題 × ユーザーの現在の問題の類似度
        """
        import numpy as np
        
        # その人が解決した問題を取得
        stmt = select(GraphNode).join(
            GraphEdge, GraphEdge.target_id == GraphNode.id
        ).where(
            GraphEdge.source_id == person_node.id,
            GraphEdge.edge_type == EdgeType.SOLVED_PROBLEM
        )
        
        result = await self.session.execute(stmt)
        problems = result.scalars().all()
        
        if not problems:
            return 0.0
        
        # 各問題とユーザーの類似度を計算
        user_vec = np.array(user_embedding)
        scores = []
        for problem in problems:
            if problem.embedding is not None:
                problem_vec = np.array(problem.embedding)
                # コサイン類似度 = 1 - コサイン距離
                similarity = 1 - np.dot(user_vec, problem_vec) / (np.linalg.norm(user_vec) * np.linalg.norm(problem_vec))
                scores.append(1 - similarity)  # 距離を類似度に変換
        
        return sum(scores) / len(scores) if scores else 0.0
    
    async def find_path(self, from_node_id: str, to_node_id: str, max_depth: int = 3) -> List[Dict]:
        """2つのノード間の最短パスを探索（BFS）"""
        # 簡易実装: 後で最適化
        return []
