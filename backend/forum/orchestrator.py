from forum.schemas import UserContext, ForumMessage, PersonMatch, DiscoveryResult
from agents.context_analyzer import analyze_context
from agents.people_matcher import evaluate_candidates
from agents.synthesizer import moderate_discussion, synthesize_final_result
from agents.trajectory_evaluator import TrajectoryEvaluator
from services.people_repository import PeopleRepository
from graph.repository import GraphRepository
from graph.trajectory import TrajectoryMatcher
from db.session import async_session_maker
from typing import AsyncGenerator
import os

def status_event(step: str, label: str) -> dict:
    return {"type": "status", "data": {"step": step, "label": label}}

async def run_discovery(query: str) -> AsyncGenerator[dict, None]:
    """Run the full discovery process with streaming events"""
    
    yield status_event("analyzing", "Analyzing your situation")
    context = await analyze_context(query)
    public_context = context.model_dump(exclude={"embedding"})
    yield {"type": "context", "data": public_context}
    
    use_graph = os.getenv("USE_GRAPH_MATCHING", "true").lower() == "true"
    
    yield status_event("searching", "Searching for relevant people")
    async with async_session_maker() as session:
        if use_graph:
            graph_repo = GraphRepository(session)
            trajectory_matcher = TrajectoryMatcher(session)
            candidates = await trajectory_matcher.find_future_selves(context.embedding, limit=10)
            
            yield {"type": "candidates", "data": {
                "count": len(candidates),
                "mode": "graph",
                "people": [{"name": c["person"].name, "score": c["final_score"]} for c in candidates]
            }}
            
            # Multi-Agent評価
            yield status_event("forum", "Multi-Agent Forum: Evaluating candidates")
            evaluator = TrajectoryEvaluator()
            evaluated = await evaluator.evaluate(query, candidates)
            
            # Round 1: 各エージェントの評価
            discussion: list[ForumMessage] = []
            for i, candidate in enumerate(evaluated[:5]):
                scores = candidate.get("agent_scores", {})
                person = candidate.get("person")
                if not person or not scores:
                    continue
                
                msg = ForumMessage(
                    agent="Problem Agent",
                    content=f"{person.name}: Problem match {scores.get('problem', 0.0):.2f}",
                    round=1
                )
                discussion.append(msg)
                yield {"type": "forum", "data": msg.model_dump()}
                
                msg = ForumMessage(
                    agent="Trajectory Agent",
                    content=f"{person.name}: Future trajectory {scores.get('trajectory', 0.0):.2f}",
                    round=1
                )
                discussion.append(msg)
                yield {"type": "forum", "data": msg.model_dump()}
                
                msg = ForumMessage(
                    agent="Network Agent",
                    content=f"{person.name}: Network value {scores.get('network', 0.0):.2f}",
                    round=1
                )
                discussion.append(msg)
                yield {"type": "forum", "data": msg.model_dump()}
            
            # Moderator統合
            yield status_event("forum", "Moderator synthesizing agent opinions")
            mod_summary = await moderate_discussion(discussion, 1)
            mod_msg = ForumMessage(agent="Moderator", content=mod_summary, round=1)
            discussion.append(mod_msg)
            yield {"type": "forum", "data": mod_msg.model_dump()}
            
            # Top 3を選出
            matches = []
            for candidate in evaluated[:3]:
                person = candidate.get("person")
                if not person:
                    continue
                
                trajectory = candidate.get("trajectory", {})
                problems = [p.name for p in trajectory.get("problems", [])]
                scores = candidate.get("agent_scores", {})
                
                matches.append(PersonMatch(
                    person_id=person.id,
                    name=person.name,
                    bio=person.properties.get("bio", ""),
                    current_situation=person.properties.get("current_situation", ""),
                    similarity_score=candidate.get("final_score", 0.0),
                    reasoning=f"Problem:{scores.get('problem', 0.0):.2f} Trajectory:{scores.get('trajectory', 0.0):.2f} Network:{scores.get('network', 0.0):.2f}",
                    role=None,
                    evidence=problems[:2] if problems else ["No trajectory data"],
                    distance_label=f"Centrality: {candidate.get('centrality', 0.0):.2f}",
                    first_question="What was your biggest challenge when you started?"
                ))
        else:
            repo = PeopleRepository(session)
            candidates = await repo.find_similar(context.embedding, limit=10)
            if len(candidates) < 3:
                candidates = await repo.find_top_matches(context.embedding, limit=10)
            
            yield {"type": "candidates", "data": {
                "count": len(candidates),
                "mode": "legacy",
                "people": [{"name": p.name, "similarity": float(s)} for p, s in candidates]
            }}
            
            yield status_event("matching", "Matching your Future Self, Comrade, and Guide")
            matches = await evaluate_candidates(context, candidates)
            if len(matches) < 3:
                used_ids = {str(match.person_id) for match in matches}
                for person, similarity in candidates:
                    if str(person.id) in used_ids:
                        continue
                    matches.append(PersonMatch(
                        person_id=person.id,
                        name=person.name,
                        bio=person.bio,
                        current_situation=person.current_situation,
                        similarity_score=similarity,
                        reasoning="Fallback based on semantic similarity",
                        role=None,
                        evidence=[person.current_situation, person.past_challenges[0] if person.past_challenges else person.bio],
                        distance_label="Network reach available",
                        first_question="What would you do first if you were starting this search again?"
                    ))
                    used_ids.add(str(person.id))
                    if len(matches) >= 3:
                        break
            
            discussion: list[ForumMessage] = []
            for match in matches[:5]:
                msg = ForumMessage(agent="Matcher", content=f"Considering {match.name}: {match.reasoning}", round=1)
                discussion.append(msg)
                yield {"type": "forum", "data": msg.model_dump()}
            
            mod_summary = await moderate_discussion(discussion, 1)
            mod_msg = ForumMessage(agent="Moderator", content=mod_summary, round=1)
            discussion.append(mod_msg)
            yield {"type": "forum", "data": mod_msg.model_dump()}
    
    # Round 2: 最終決定
    yield status_event("matching", "Final decision on top 3 connections")
    for match in matches[:3]:
        msg = ForumMessage(
            agent="Synthesizer",
            content=f"SELECTED: {match.name} (Score: {match.similarity_score:.2f}) - {match.reasoning}",
            round=2
        )
        discussion.append(msg)
        yield {"type": "forum", "data": msg.model_dump()}
    
    yield status_event("intro_ready", "Preparing your intro and next moves")
    result = await synthesize_final_result(context, matches, discussion)
    yield {"type": "result", "data": result.model_dump()}
