from openai import AsyncOpenAI
from config import settings
from forum.schemas import ActionPlanItem, DiscoveryResult, ForumMessage, IntroDraft, PersonMatch, UserContext
from typing import List
import json

client = AsyncOpenAI(api_key=settings.openai_api_key)

async def moderate_discussion(messages: List[ForumMessage], round_num: int) -> str:
    discussion = "\n".join([f"{m.agent}: {m.content}" for m in messages])
    
    prompt = f"""You are moderating a multi-agent evaluation forum.

Round {round_num} Discussion:
{discussion}

Synthesize:
1. Which candidates show strongest signals across agents?
2. What are the key differentiators?
3. Any concerns or trade-offs?

Keep it concise (3-4 sentences) and decision-focused."""

    response = await client.chat.completions.create(
        model=settings.openai_chat_model,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=256
    )
    
    return response.choices[0].message.content

def select_people(matches: List[PersonMatch]) -> tuple[PersonMatch, PersonMatch, PersonMatch]:
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
        return selected.model_copy(update={"role": role})

    used_ids: set[str] = set()
    future_self = pick_match("future_self", used_ids)
    used_ids.add(str(future_self.person_id))
    comrade = pick_match("comrade", used_ids)
    used_ids.add(str(comrade.person_id))
    guide = pick_match("guide", used_ids)
    return future_self, comrade, guide

async def build_action_plan(
    context: UserContext,
    future_self: PersonMatch,
    comrade: PersonMatch,
    guide: PersonMatch
) -> tuple[str, str, str, List[ActionPlanItem]]:
    prompt = f"""You are preparing a concrete weekly action plan for a founder.

User context:
- Situation: {context.situation}
- Goals: {', '.join(context.goals)}
- Obstacles: {', '.join(context.obstacles)}
- Emotional context: {context.emotional_context}

Selected people:
- Future Self: {future_self.name} | {future_self.reasoning}
- Comrade: {comrade.name} | {comrade.reasoning}
- Guide: {guide.name} | {guide.reasoning}

Return JSON with:
- current_state_summary: one sentence
- primary_blocker: short phrase
- desired_next_step: short phrase
- actions:
  - comrade: {{title, rationale}}
  - future_self: {{title, rationale}}
  - guide: {{title, rationale}}

Keep each title practical and under 12 words.
Keep each rationale to one sentence.
Return only valid JSON."""

    try:
        response = await client.chat.completions.create(
            model=settings.openai_chat_model,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=512
        )
        result = json.loads(response.choices[0].message.content)
        actions = [
            ActionPlanItem(
                title=result["actions"]["comrade"]["title"],
                rationale=result["actions"]["comrade"]["rationale"],
                target_person_id=comrade.person_id
            ),
            ActionPlanItem(
                title=result["actions"]["future_self"]["title"],
                rationale=result["actions"]["future_self"]["rationale"],
                target_person_id=future_self.person_id
            ),
            ActionPlanItem(
                title=result["actions"]["guide"]["title"],
                rationale=result["actions"]["guide"]["rationale"],
                target_person_id=guide.person_id
            ),
        ]
        return (
            result["current_state_summary"],
            result["primary_blocker"],
            result["desired_next_step"],
            actions,
        )
    except Exception:
        primary_blocker = context.obstacles[0] if context.obstacles else "Unclear next step"
        desired_next_step = context.goals[0] if context.goals else "Find the next meaningful connection"
        current_state_summary = f"{context.situation.rstrip('.')}."
        return (
            current_state_summary,
            primary_blocker,
            desired_next_step,
            [
                ActionPlanItem(
                    title=f"Compare notes with {comrade.name}",
                    rationale="Use a peer conversation to sharpen what is not working in your current approach.",
                    target_person_id=comrade.person_id
                ),
                ActionPlanItem(
                    title=f"Ask {future_self.name} for pattern advice",
                    rationale="Learn which decisions mattered most from someone who has already crossed this gap.",
                    target_person_id=future_self.person_id
                ),
                ActionPlanItem(
                    title=f"Get strategic guidance from {guide.name}",
                    rationale="Use an experienced guide to improve how you frame your outreach and next step.",
                    target_person_id=guide.person_id
                ),
            ],
        )

async def build_intro_drafts(
    context: UserContext,
    people: List[PersonMatch]
) -> List[IntroDraft]:
    people_block = "\n".join(
        [
            f"- {person.role}: {person.name} | Bio: {person.bio} | Why: {person.reasoning}"
            for person in people
        ]
    )

    prompt = f"""Write concise outreach drafts for a founder.

User context:
- Situation: {context.situation}
- Goals: {', '.join(context.goals)}
- Obstacles: {', '.join(context.obstacles)}

People:
{people_block}

Return JSON with:
- drafts: array of objects with
  - person_name
  - direct_message
  - intro_request

Rules:
- direct_message: under 90 words, practical, respectful
- intro_request: under 70 words, asks a mutual contact or intermediary for help
- each message should feel specific to that person
Return only valid JSON."""

    try:
        response = await client.chat.completions.create(
            model=settings.openai_chat_model,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=800
        )
        result = json.loads(response.choices[0].message.content)
        drafts_by_name = {draft["person_name"]: draft for draft in result.get("drafts", [])}
        built_drafts: List[IntroDraft] = []

        for person in people:
            draft = drafts_by_name.get(person.name)
            if draft:
                built_drafts.append(
                    IntroDraft(
                        person_id=person.person_id,
                        person_name=person.name,
                        direct_message=draft["direct_message"],
                        intro_request=draft["intro_request"],
                    )
                )

        if built_drafts:
            return built_drafts
    except Exception:
        pass

    fallback_drafts = []
    for person in people:
        fallback_drafts.append(
            IntroDraft(
                person_id=person.person_id,
                person_name=person.name,
                direct_message=(
                    f"Hi {person.name}, I'm working through {context.situation.lower()} "
                    f"and your experience stood out to me. {person.first_question or 'I would love to ask one practical question about how you approached it.'}"
                ),
                intro_request=(
                    f"Could you introduce me to {person.name}? I'm navigating {context.situation.lower()} "
                    "and I think a short conversation would help me avoid obvious mistakes."
                ),
            )
        )
    return fallback_drafts

async def synthesize_final_result(
    context: UserContext,
    matches: List[PersonMatch],
    discussion: List[ForumMessage]
) -> DiscoveryResult:
    future_self, comrade, guide = select_people(matches)
    current_state_summary, primary_blocker, desired_next_step, action_plan = await build_action_plan(
        context,
        future_self,
        comrade,
        guide,
    )
    intro_drafts = await build_intro_drafts(context, [future_self, comrade, guide])
    
    return DiscoveryResult(
        current_state_summary=current_state_summary,
        primary_blocker=primary_blocker,
        desired_next_step=desired_next_step,
        future_self=future_self,
        comrade=comrade,
        guide=guide,
        action_plan=action_plan,
        intro_drafts=intro_drafts,
        discussion=discussion
    )
