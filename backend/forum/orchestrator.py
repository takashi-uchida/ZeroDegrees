from forum.schemas import UserContext, ForumMessage, PersonMatch, DiscoveryResult
from agents.context_analyzer import analyze_context
from agents.people_matcher import evaluate_candidates
from agents.synthesizer import moderate_discussion, synthesize_final_result
from services.people_repository import PeopleRepository
from db.session import async_session_maker
from typing import AsyncGenerator
import json

async def run_discovery(query: str) -> AsyncGenerator[dict, None]:
    """Run the full discovery process with streaming events"""
    
    # Step 1: Analyze context
    yield {"type": "status", "data": "Analyzing your situation..."}
    context = await analyze_context(query)
    yield {"type": "context", "data": context.model_dump()}
    
    # Step 2: Find candidates
    yield {"type": "status", "data": "Searching for potential matches..."}
    async with async_session_maker() as session:
        repo = PeopleRepository(session)
        candidates = await repo.find_similar(context.embedding, limit=10)
        if len(candidates) < 3:
            candidates = await repo.find_top_matches(context.embedding, limit=10)
    
    yield {"type": "candidates", "data": {
        "count": len(candidates),
        "people": [{"name": p.name, "similarity": float(s)} for p, s in candidates]
    }}
    
    # Step 3: Evaluate candidates
    yield {"type": "status", "data": "Evaluating candidates..."}
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
            ))
            used_ids.add(str(person.id))
            if len(matches) >= 3:
                break
    
    discussion: list[ForumMessage] = []
    
    # Round 1: Initial observations
    yield {"type": "status", "data": "Round 1: Initial analysis..."}
    for match in matches[:5]:  # Top 5
        msg = ForumMessage(
            agent="Matcher",
            content=f"Considering {match.name} as {match.role}: {match.reasoning}",
            round=1
        )
        discussion.append(msg)
        yield {"type": "forum", "data": msg.model_dump()}
    
    # Moderator summary
    yield {"type": "status", "data": "Moderator summarizing..."}
    mod_summary = await moderate_discussion(discussion, 1)
    mod_msg = ForumMessage(agent="Moderator", content=mod_summary, round=1)
    discussion.append(mod_msg)
    yield {"type": "forum", "data": mod_msg.model_dump()}
    
    # Round 2: Refinement
    yield {"type": "status", "data": "Round 2: Refining selections..."}
    for match in matches[:3]:  # Top 3
        msg = ForumMessage(
            agent="Analyzer",
            content=f"Strong match for {match.role}: {match.name}. Score: {match.similarity_score:.2f}",
            round=2
        )
        discussion.append(msg)
        yield {"type": "forum", "data": msg.model_dump()}
    
    # Final synthesis
    yield {"type": "status", "data": "Finalizing recommendations..."}
    result = await synthesize_final_result(matches, discussion)
    yield {"type": "result", "data": result.model_dump()}
