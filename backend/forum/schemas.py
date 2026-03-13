from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID

class UserContext(BaseModel):
    situation: str
    goals: List[str]
    obstacles: List[str]
    emotional_context: str
    embedding: Optional[List[float]] = None

class PersonMatch(BaseModel):
    person_id: UUID
    name: str
    bio: str
    current_situation: str
    similarity_score: float
    reasoning: str
    role: Optional[str] = None  # "future_self", "comrade", "guide"
    evidence: List[str] = Field(default_factory=list)
    distance_label: Optional[str] = None
    first_question: Optional[str] = None

class ActionPlanItem(BaseModel):
    title: str
    rationale: str
    target_person_id: Optional[UUID] = None

class IntroDraft(BaseModel):
    person_id: UUID
    person_name: str
    direct_message: str
    intro_request: str

class ForumMessage(BaseModel):
    agent: str
    content: str
    round: int

class DiscoveryResult(BaseModel):
    current_state_summary: str
    primary_blocker: str
    desired_next_step: str
    future_self: PersonMatch
    comrade: PersonMatch
    guide: PersonMatch
    action_plan: List[ActionPlanItem]
    intro_drafts: List[IntroDraft]
    discussion: List[ForumMessage]
