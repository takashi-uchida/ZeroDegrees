from typing import List, Dict
from openai import AsyncOpenAI
from config import settings

client = AsyncOpenAI(api_key=settings.openai_api_key)


class TrajectoryEvaluator:
    """Multi-Agent評価: 3つの視点から候補者を評価"""
    
    async def evaluate(self, user_query: str, candidates: List[Dict]) -> List[Dict]:
        """3エージェントによる並列評価"""
        evaluations = await self._run_agents(user_query, candidates)
        return self._synthesize(candidates, evaluations)
    
    async def _run_agents(self, user_query: str, candidates: List[Dict]) -> Dict[str, List[float]]:
        """3エージェントを並列実行"""
        import asyncio
        
        tasks = [
            self._agent_problem_match(user_query, candidates),
            self._agent_trajectory_match(user_query, candidates),
            self._agent_network_value(user_query, candidates)
        ]
        
        results = await asyncio.gather(*tasks)
        return {
            "problem_scores": results[0],
            "trajectory_scores": results[1],
            "network_scores": results[2]
        }
    
    async def _agent_problem_match(self, user_query: str, candidates: List[Dict]) -> List[float]:
        """Agent A: 問題の一致度を評価"""
        prompt = f"""User's problem: {user_query}

Rate each candidate's relevance to solving this specific problem (0-1):
{self._format_candidates(candidates)}

Return only numbers, one per line."""
        
        response = await client.chat.completions.create(
            model=settings.openai_chat_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3
        )
        
        return self._parse_scores(response.choices[0].message.content, len(candidates))
    
    async def _agent_trajectory_match(self, user_query: str, candidates: List[Dict]) -> List[float]:
        """Agent B: 未来軌道の一致度を評価"""
        prompt = f"""User's current state: {user_query}

Rate how well each candidate represents the user's future trajectory (0-1):
{self._format_candidates_with_trajectory(candidates)}

Return only numbers, one per line."""
        
        response = await client.chat.completions.create(
            model=settings.openai_chat_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3
        )
        
        return self._parse_scores(response.choices[0].message.content, len(candidates))
    
    async def _agent_network_value(self, user_query: str, candidates: List[Dict]) -> List[float]:
        """Agent C: ネットワーク価値を評価"""
        prompt = f"""User's goal: {user_query}

Rate each candidate's network value and influence (0-1):
{self._format_candidates_with_centrality(candidates)}

Return only numbers, one per line."""
        
        response = await client.chat.completions.create(
            model=settings.openai_chat_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3
        )
        
        return self._parse_scores(response.choices[0].message.content, len(candidates))
    
    def _format_candidates(self, candidates: List[Dict]) -> str:
        lines = []
        for i, c in enumerate(candidates):
            person = c["person"]
            lines.append(f"{i+1}. {person.name}: {person.properties.get('bio', '')}")
        return "\n".join(lines)
    
    def _format_candidates_with_trajectory(self, candidates: List[Dict]) -> str:
        lines = []
        for i, c in enumerate(candidates):
            person = c["person"]
            trajectory = c.get("trajectory", {})
            problems = [p.name for p in trajectory.get("problems", [])]
            lines.append(f"{i+1}. {person.name} - Solved: {', '.join(problems[:3])}")
        return "\n".join(lines)
    
    def _format_candidates_with_centrality(self, candidates: List[Dict]) -> str:
        lines = []
        for i, c in enumerate(candidates):
            person = c["person"]
            centrality = c.get("centrality", 0)
            lines.append(f"{i+1}. {person.name} - Centrality: {centrality:.2f}")
        return "\n".join(lines)
    
    def _parse_scores(self, text: str, expected_count: int) -> List[float]:
        """LLM出力から数値を抽出"""
        lines = text.strip().split("\n")
        scores = []
        for line in lines:
            try:
                score = float(line.strip())
                scores.append(max(0.0, min(1.0, score)))
            except ValueError:
                continue
        
        while len(scores) < expected_count:
            scores.append(0.5)
        
        return scores[:expected_count]
    
    def _synthesize(self, candidates: List[Dict], evaluations: Dict[str, List[float]]) -> List[Dict]:
        """3エージェントの評価を統合"""
        for i, candidate in enumerate(candidates):
            candidate["agent_scores"] = {
                "problem": evaluations["problem_scores"][i],
                "trajectory": evaluations["trajectory_scores"][i],
                "network": evaluations["network_scores"][i]
            }
            candidate["final_score"] = (
                evaluations["problem_scores"][i] * 0.4 +
                evaluations["trajectory_scores"][i] * 0.4 +
                evaluations["network_scores"][i] * 0.2
            )
        
        candidates.sort(key=lambda x: x["final_score"], reverse=True)
        return candidates
