from sqlalchemy import Column, String, ARRAY, Text, Float, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector
import uuid
from db.session import Base

class Person(Base):
    __tablename__ = "people"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    bio = Column(Text, nullable=False)
    current_situation = Column(Text, nullable=False)
    past_challenges = Column(ARRAY(Text), nullable=False)
    skills = Column(ARRAY(String), nullable=False)
    goals = Column(ARRAY(Text), nullable=False)
    embedding = Column(Vector(1536), nullable=False)


class GraphNode(Base):
    __tablename__ = "graph_nodes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    node_type = Column(String, nullable=False)
    name = Column(String, nullable=False)
    properties = Column(JSON, nullable=False, default={})
    embedding = Column(Vector(1536))


class GraphEdge(Base):
    __tablename__ = "graph_edges"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_id = Column(UUID(as_uuid=True), ForeignKey("graph_nodes.id"), nullable=False)
    target_id = Column(UUID(as_uuid=True), ForeignKey("graph_nodes.id"), nullable=False)
    edge_type = Column(String, nullable=False)
    weight = Column(Float, nullable=False, default=1.0)
    properties = Column(JSON, default={})
