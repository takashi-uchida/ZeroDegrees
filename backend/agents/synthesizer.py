from openai import AsyncOpenAI
from config import settings
from forum.schemas import ForumMessage, PersonMatch, DiscoveryResult
from typing import List

client = AsyncOpenAI(api_key=settings.openai_api_key)

async def moderate_discussion(messages: List[ForumMessage], round_num: int) -> str:
    discussion = "\n".join([f"{m.agent}: {m.content}" for m in messages])
    
    prompt = f"""You are moderating a discussion about matching a user with the right people.

Round {round_num} Discussion:
{discussion}

Summarize the key points, highlight any disagreements, and suggest what to focus on next.
Keep it concise (3-4 sentences)."""

    response = await client.chat.completions.create(
        model=settings.openai_chat_model,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=256
    )
    
    return response.choices[0].message.content

async def synthesize_final_result(
    matches: List[PersonMatch],
    discussion: List[ForumMessage]
) -> DiscoveryResult:
    ranked_matches = sorted(matches, key=lambda match: match.similarity_score, reverse=True)

    def pick_match(role: str, used_ids: set[str]) -> PersonMatch:
        role_matches = [
            match for match in ranked_matches
            if match.role == role and str(match.person_id) not in used_ids
        ]
        if role_matches:
            return role_matches[0]

        fallback_matches = [
            match for match in ranked_matches
            if str(match.person_id) not in used_ids
        ]
        if not fallback_matches:
            if not ranked_matches:
                raise ValueError("No matches available to synthesize a result")
            return ranked_matches[0]
        selected = fallback_matches[0]
        if selected.role is None:
            selected = selected.model_copy(update={"role": role})
        return selected

    used_ids: set[str] = set()
    future_self = pick_match("future_self", used_ids)
    if future_self.role is None:
        future_self = future_self.model_copy(update={"role": "future_self"})
    used_ids.add(str(future_self.person_id))
    comrade = pick_match("comrade", used_ids)
    if comrade.role is None:
        comrade = comrade.model_copy(update={"role": "comrade"})
    used_ids.add(str(comrade.person_id))
    guide = pick_match("guide", used_ids)
    if guide.role is None:
        guide = guide.model_copy(update={"role": "guide"})
    
    return DiscoveryResult(
        future_self=future_self,
        comrade=comrade,
        guide=guide,
        discussion=discussion
    )
