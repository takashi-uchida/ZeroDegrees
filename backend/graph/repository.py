from typing import List, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from db.models import GraphNode
from graph.trajectory import TrajectoryMatcher
from agents.trajectory_evaluator import TrajectoryEvaluator
from forum.schemas import PersonMatch
from uuid import UUID


class GraphRepository:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.matcher = TrajectoryMatcher(session)
        self.evaluator = TrajectoryEvaluator()
    
    async def find_trajectory_matches(self, user_query: str, user_embedding: List[float], limit: int = 3) -> List[PersonMatch]:
        """グラフベース軌道マッチング + Multi-Agent評価"""
        candidates = await self.matcher.find_future_selves(user_embedding, limit=limit * 2)
        evaluated = await self.evaluator.evaluate(user_query, candidates)
        
        matches = []
        for result in evaluated[:limit]:
            person_node = result["person"]
            props = person_node.properties
            agent_scores = result.get("agent_scores", {})
            
            match = PersonMatch(
                person_id=UUID(str(person_node.id)),
                name=person_node.name,
                bio=props.get("bio", ""),
                current_situation=props.get("current_situation", ""),
                similarity_score=result["final_score"],
                reasoning=self._build_reasoning(result, agent_scores),
                role=self._infer_role(result),
                evidence=self._extract_evidence(result),
                distance_label=f"Trajectory: {result.get('trajectory_score', 0):.2f}",
                first_question=self._generate_question(result)
            )
            matches.append(match)
        
        return matches
    
    def _build_reasoning(self, result: Dict, agent_scores: Dict) -> str:
        parts = [
            f"Problem match: {agent_scores.get('problem', 0):.2f}",
            f"Trajectory match: {agent_scores.get('trajectory', 0):.2f}",
            f"Network value: {agent_scores.get('network', 0):.2f}"
        ]
        return " | ".join(parts)
    
    def _infer_role(self, result: Dict) -> str:
        trajectory_score = result.get("trajectory_score", 0)
        if trajectory_score > 0.7:
            return "future_self"
        elif trajectory_score > 0.5:
            return "comrade"
        else:
            return "guide"
    
    def _extract_evidence(self, result: Dict) -> List[str]:
        trajectory = result.get("trajectory", {})
        problems = trajectory.get("problems", [])
        return [p.name for p in problems[:3]]
    
    def _generate_question(self, result: Dict) -> str:
        role = self._infer_role(result)
        questions = {
            "future_self": "How did you navigate this transition?",
            "comrade": "What's your current approach to this challenge?",
            "guide": "What advice would you give someone starting this journey?"
        }
        return questions.get(role, "How can we help each other?")
