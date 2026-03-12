from sqlalchemy import Column, String, ARRAY, Text
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
