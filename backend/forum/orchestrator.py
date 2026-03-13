from forum.schemas import UserContext, ForumMessage, PersonMatch, DiscoveryResult
from agents.context_analyzer import analyze_context
from agents.people_matcher import evaluate_candidates
from agents.synthesizer import moderate_discussion, synthesize_final_result
from services.people_repository import PeopleRepository
from graph.repository import GraphRepository
from db.session import async_session_maker
from typing import AsyncGenerator
import os

def status_event(step: str, label: str) -> dict:
    return {"type": "status", "data": {"step": step, "label": label}}

async def run_discovery(query: str) -> AsyncGenerator[dict, None]:
    """Run the full discovery process with streaming events"""
    
    # Step 1: Analyze context
    yield status_event("analyzing", "Analyzing your situation")
    context = await analyze_context(query)
    public_context = context.model_dump(exclude={"embedding"})
    yield {"type": "context", "data": public_context}
    
    # Step 2: Find candidates (グラフモード or 従来モード)
    use_graph = os.getenv("USE_GRAPH_MATCHING", "false").lower() == "true"
    
    yield status_event("searching", "Searching for relevant people")
    async with async_session_maker() as session:
        if use_graph:
            # グラフベースの軌道マッチング
            graph_repo = GraphRepository(session)
            matches = await graph_repo.find_trajectory_matches(context.embedding, limit=3)
            yield {"type": "candidates", "data": {
                "count": len(matches),
                "mode": "graph",
                "people": [{"name": m.name, "score": m.similarity_score} for m in matches]
            }}
        else:
            # 従来の類似度検索
            repo = PeopleRepository(session)
            candidates = await repo.find_similar(context.embedding, limit=10)
            if len(candidates) < 3:
                candidates = await repo.find_top_matches(context.embedding, limit=10)
            
            yield {"type": "candidates", "data": {
                "count": len(candidates),
                "mode": "legacy",
                "people": [{"name": p.name, "similarity": float(s)} for p, s in candidates]
            }}
            
            # Step 3: Evaluate candidates
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
                        reasoning="Selected as a fallback based on semantic similarity when fewer than three strong role matches were available.",
                        role=None,
                        evidence=[
                            person.current_situation,
                            person.past_challenges[0] if person.past_challenges else person.bio,
                        ],
                        distance_label="Network reach available",
                        first_question="What would you do first if you were starting this search again?",
                    ))
                    used_ids.add(str(person.id))
                    if len(matches) >= 3:
                        break
    
    discussion: list[ForumMessage] = []
    
    # Round 1: Initial observations
    yield status_event("matching", "Comparing candidate fit")
    for match in matches[:5]:  # Top 5
        msg = ForumMessage(
            agent="Matcher",
            content=f"Considering {match.name} as {match.role or 'candidate'}: {match.reasoning}",
            round=1
        )
        discussion.append(msg)
        yield {"type": "forum", "data": msg.model_dump()}
    
    # Moderator summary
    yield status_event("matching", "Synthesizing the strongest signals")
    mod_summary = await moderate_discussion(discussion, 1)
    mod_msg = ForumMessage(agent="Moderator", content=mod_summary, round=1)
    discussion.append(mod_msg)
    yield {"type": "forum", "data": mod_msg.model_dump()}
    
    # Round 2: Refinement
    yield status_event("matching", "Preparing your best next connections")
    for match in matches[:3]:  # Top 3
        msg = ForumMessage(
            agent="Analyzer",
            content=f"Strong match for {match.role or 'candidate'}: {match.name}. Score: {match.similarity_score:.2f}",
            round=2
        )
        discussion.append(msg)
        yield {"type": "forum", "data": msg.model_dump()}
    
    # Final synthesis
    yield status_event("intro_ready", "Preparing your intro and next moves")
    result = await synthesize_final_result(context, matches, discussion)
    yield {"type": "result", "data": result.model_dump()}
