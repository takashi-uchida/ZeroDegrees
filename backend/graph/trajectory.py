from typing import List, Dict, Set
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from db.models import GraphNode, GraphEdge
from graph.schema import NodeType, EdgeType
import numpy as np
from collections import deque


class TrajectoryMatcher:
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def find_future_selves(self, user_embedding: List[float], limit: int = 3) -> List[Dict]:
        """未来軌道マッチング: 今のあなたではなく、数年後のあなたに近い人を発見"""
        from pgvector.sqlalchemy import Vector
        
        stmt = select(
            GraphNode,
            func.cosine_distance(GraphNode.embedding, func.cast(user_embedding, Vector(1536))).label("distance")
        ).where(GraphNode.node_type == NodeType.PERSON).order_by("distance").limit(limit * 5)
        
        result = await self.session.execute(stmt)
        candidates = result.all()
        
        scored = []
        for node, distance in candidates:
            trajectory = await self._extract_trajectory(node)
            trajectory_score = self._compute_trajectory_similarity(trajectory, user_embedding)
            graph_centrality = await self._compute_centrality(node)
            
            scored.append({
                "person": node,
                "distance": distance,
                "trajectory_score": trajectory_score,
                "centrality": graph_centrality,
                "trajectory": trajectory,
                "final_score": (1 - distance) * 0.3 + trajectory_score * 0.5 + graph_centrality * 0.2
            })
        
        scored.sort(key=lambda x: x["final_score"], reverse=True)
        return scored[:limit]
    
    async def _extract_trajectory(self, person_node: GraphNode) -> Dict:
        """人の軌道を抽出: 過去の問題 → 現在のスキル → 未来のゴール"""
        stmt_problems = select(GraphNode).join(
            GraphEdge, GraphEdge.target_id == GraphNode.id
        ).where(
            GraphEdge.source_id == person_node.id,
            GraphEdge.edge_type == EdgeType.SOLVED_PROBLEM
        )
        
        stmt_skills = select(GraphNode).join(
            GraphEdge, GraphEdge.target_id == GraphNode.id
        ).where(
            GraphEdge.source_id == person_node.id,
            GraphEdge.edge_type == EdgeType.HAS_SKILL
        )
        
        stmt_goals = select(GraphNode).join(
            GraphEdge, GraphEdge.target_id == GraphNode.id
        ).where(
            GraphEdge.source_id == person_node.id,
            GraphEdge.edge_type == EdgeType.WORKING_ON
        )
        
        problems = (await self.session.execute(stmt_problems)).scalars().all()
        skills = (await self.session.execute(stmt_skills)).scalars().all()
        goals = (await self.session.execute(stmt_goals)).scalars().all()
        
        return {
            "problems": [p for p in problems if p.embedding is not None],
            "skills": [s for s in skills if s.embedding is not None],
            "goals": [g for g in goals if g.embedding is not None]
        }
    
    def _compute_trajectory_similarity(self, trajectory: Dict, user_embedding: List[float]) -> float:
        """軌道類似度: ユーザーの現在 ≈ 候補者の過去問題"""
        problems = trajectory["problems"]
        if not problems:
            return 0.0
        
        user_vec = np.array(user_embedding)
        user_norm = np.linalg.norm(user_vec)
        if user_norm == 0:
            return 0.0
        
        similarities = []
        for problem in problems:
            problem_vec = np.array(problem.embedding)
            problem_norm = np.linalg.norm(problem_vec)
            if problem_norm == 0:
                continue
            cos_sim = np.dot(user_vec, problem_vec) / (user_norm * problem_norm)
            similarities.append(max(0, cos_sim))
        
        return max(similarities) if similarities else 0.0
    
    async def _compute_centrality(self, node: GraphNode) -> float:
        """グラフ中心性: 接続数で影響力を測定"""
        stmt = select(func.count(GraphEdge.id)).where(
            (GraphEdge.source_id == node.id) | (GraphEdge.target_id == node.id)
        )
        count = (await self.session.execute(stmt)).scalar()
        return min((count or 0) / 20.0, 1.0)
    
    async def find_path(self, from_node_id: str, to_node_id: str, max_depth: int = 3) -> List[Dict]:
        """BFSで最短パスを探索"""
        queue = deque([(from_node_id, [from_node_id])])
        visited: Set[str] = {from_node_id}
        
        while queue:
            current_id, path = queue.popleft()
            
            if len(path) > max_depth:
                continue
            
            if current_id == to_node_id:
                return await self._hydrate_path(path)
            
            stmt = select(GraphEdge).where(GraphEdge.source_id == current_id)
            edges = (await self.session.execute(stmt)).scalars().all()
            
            for edge in edges:
                if edge.target_id not in visited:
                    visited.add(edge.target_id)
                    queue.append((edge.target_id, path + [edge.target_id]))
        
        return []
    
    async def _hydrate_path(self, node_ids: List[str]) -> List[Dict]:
        """ノードIDからノード情報を取得"""
        stmt = select(GraphNode).where(GraphNode.id.in_(node_ids))
        nodes = (await self.session.execute(stmt)).scalars().all()
        node_map = {str(n.id): n for n in nodes}
        return [{"id": nid, "name": node_map[nid].name, "type": node_map[nid].node_type} for nid in node_ids if nid in node_map]
