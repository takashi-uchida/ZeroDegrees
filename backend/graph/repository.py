from typing import List, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from db.models import GraphNode
from graph.trajectory import TrajectoryMatcher
from forum.schemas import PersonMatch
from uuid import UUID


class GraphRepository:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.matcher = TrajectoryMatcher(session)
    
    async def find_trajectory_matches(self, user_embedding: List[float], limit: int = 3) -> List[PersonMatch]:
        """
        グラフベースの軌道マッチング
        従来の類似度検索ではなく、未来軌道の一致で人を探す
        """
        results = await self.matcher.find_future_selves(user_embedding, limit=limit)
        
        matches = []
        for result in results:
            person_node = result["person"]
            props = person_node.properties
            
            match = PersonMatch(
                person_id=UUID(str(person_node.id)),
                name=person_node.name,
                bio=props.get("bio", ""),
                current_situation=props.get("current_situation", ""),
                similarity_score=result["final_score"],
                reasoning=f"Trajectory match score: {result['trajectory_score']:.2f}. This person has solved problems similar to yours.",
                role=self._infer_role(result),
                evidence=[],
                distance_label="Graph distance available",
                first_question="What was the turning point in solving this problem?"
            )
            matches.append(match)
        
        return matches
    
    def _infer_role(self, result: Dict) -> str:
        """スコアから役割を推定"""
        trajectory_score = result["trajectory_score"]
        
        if trajectory_score > 0.8:
            return "future_self"
        elif trajectory_score > 0.6:
            return "comrade"
        else:
            return "guide"
