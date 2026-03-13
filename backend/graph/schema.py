from enum import Enum
from typing import Optional
from pydantic import BaseModel


class NodeType(str, Enum):
    PERSON = "person"
    SKILL = "skill"
    PROBLEM = "problem"
    GOAL = "goal"
    COMPANY = "company"
    PROJECT = "project"


class EdgeType(str, Enum):
    HAS_SKILL = "has_skill"
    SOLVED_PROBLEM = "solved_problem"
    WORKING_ON = "working_on"
    WORKED_WITH = "worked_with"
    SIMILAR_TRAJECTORY = "similar_trajectory"
    FUTURE_SELF = "future_self"
    INSPIRED_BY = "inspired_by"


class GraphNode(BaseModel):
    id: str
    type: NodeType
    name: str
    properties: dict


class GraphEdge(BaseModel):
    source_id: str
    target_id: str
    type: EdgeType
    weight: float
    properties: Optional[dict] = None
