from pydantic import BaseModel
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

class ForumMessage(BaseModel):
    agent: str
    content: str
    round: int

class DiscoveryResult(BaseModel):
    future_self: PersonMatch
    comrade: PersonMatch
    guide: PersonMatch
    discussion: List[ForumMessage]
