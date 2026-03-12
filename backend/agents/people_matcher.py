from openai import AsyncOpenAI
from config import settings
from forum.schemas import UserContext, PersonMatch
from db.models import Person
from typing import List, Tuple
import json

client = AsyncOpenAI(api_key=settings.openai_api_key)

async def evaluate_candidates(
    context: UserContext,
    candidates: List[Tuple[Person, float]]
) -> List[PersonMatch]:
    matches = []
    
    for person, similarity in candidates:
        prompt = f"""Evaluate this person as a potential match for the user.

User Context:
- Situation: {context.situation}
- Goals: {', '.join(context.goals)}
- Obstacles: {', '.join(context.obstacles)}
- Emotional context: {context.emotional_context}

Candidate:
- Name: {person.name}
- Bio: {person.bio}
- Current: {person.current_situation}
- Past challenges: {', '.join(person.past_challenges)}

Evaluate if this person could be:
1. Future Self (already overcame similar challenges)
2. Comrade (facing similar challenges now)
3. Guide (can provide direction/perspective)

Return JSON with:
- role: one of "future_self", "comrade", "guide", or "none"
- reasoning: 2-3 sentences explaining the match
- score: 0-10 rating

Return only valid JSON."""

        response = await client.chat.completions.create(
            model=settings.openai_chat_model,
            max_tokens=512,
            response_format={"type": "json_object"},
            messages=[{"role": "user", "content": prompt}]
        )
        
        result = json.loads(response.choices[0].message.content)
        
        if result["role"] != "none":
            matches.append(PersonMatch(
                person_id=person.id,
                name=person.name,
                bio=person.bio,
                current_situation=person.current_situation,
                similarity_score=similarity,
                reasoning=result["reasoning"],
                role=result["role"]
            ))
    
    return matches
