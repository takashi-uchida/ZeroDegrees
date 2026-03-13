from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Text, Integer
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from db.session import Base

class Relationship(Base):
    __tablename__ = "relationships"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    person_a_id = Column(UUID(as_uuid=True), ForeignKey("people.id"), nullable=False)
    person_b_id = Column(UUID(as_uuid=True), ForeignKey("people.id"), nullable=False)
    trust_score = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class HelpHistory(Base):
    __tablename__ = "help_history"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    relationship_id = Column(UUID(as_uuid=True), ForeignKey("relationships.id"), nullable=False)
    helper_id = Column(UUID(as_uuid=True), ForeignKey("people.id"), nullable=False)
    helped_id = Column(UUID(as_uuid=True), ForeignKey("people.id"), nullable=False)
    description = Column(Text, nullable=False)
    impact_score = Column(Float, nullable=False, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow)


class ThanksToken(Base):
    __tablename__ = "thanks_tokens"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    help_history_id = Column(UUID(as_uuid=True), ForeignKey("help_history.id"), nullable=False)
    from_person_id = Column(UUID(as_uuid=True), ForeignKey("people.id"), nullable=False)
    to_person_id = Column(UUID(as_uuid=True), ForeignKey("people.id"), nullable=False)
    amount = Column(Integer, nullable=False, default=1)
    message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
