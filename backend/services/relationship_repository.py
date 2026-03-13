from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, select
from db.relationship_models import Relationship, HelpHistory, ThanksToken
from uuid import UUID
from datetime import datetime
from typing import List, Optional

class RelationshipRepository:
    def __init__(self, db: Session):
        self.db = db

    async def get_or_create_relationship(self, person_a_id: UUID, person_b_id: UUID) -> Relationship:
        result = await self.db.execute(
            select(Relationship).filter(
                or_(
                    and_(Relationship.person_a_id == person_a_id, Relationship.person_b_id == person_b_id),
                    and_(Relationship.person_a_id == person_b_id, Relationship.person_b_id == person_a_id)
                )
            )
        )
        rel = result.scalar_one_or_none()
        
        if not rel:
            rel = Relationship(person_a_id=person_a_id, person_b_id=person_b_id)
            self.db.add(rel)
            await self.db.commit()
            await self.db.refresh(rel)
        return rel

    async def add_help(self, helper_id: UUID, helped_id: UUID, description: str, impact_score: float = 1.0) -> HelpHistory:
        rel = await self.get_or_create_relationship(helper_id, helped_id)
        help_record = HelpHistory(
            relationship_id=rel.id,
            helper_id=helper_id,
            helped_id=helped_id,
            description=description,
            impact_score=impact_score
        )
        self.db.add(help_record)
        rel.trust_score += impact_score * 0.1
        rel.updated_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(help_record)
        return help_record

    async def send_thanks(self, from_person_id: UUID, to_person_id: UUID, help_history_id: UUID, amount: int = 1, message: Optional[str] = None) -> ThanksToken:
        token = ThanksToken(
            help_history_id=help_history_id,
            from_person_id=from_person_id,
            to_person_id=to_person_id,
            amount=amount,
            message=message
        )
        self.db.add(token)
        rel = await self.get_or_create_relationship(from_person_id, to_person_id)
        rel.trust_score += amount * 0.05
        rel.updated_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(token)
        return token

    async def get_trust_score(self, person_a_id: UUID, person_b_id: UUID) -> float:
        rel = await self.get_or_create_relationship(person_a_id, person_b_id)
        return rel.trust_score

    async def get_help_history(self, person_a_id: UUID, person_b_id: UUID) -> List[HelpHistory]:
        rel = await self.get_or_create_relationship(person_a_id, person_b_id)
        result = await self.db.execute(select(HelpHistory).filter(HelpHistory.relationship_id == rel.id))
        return result.scalars().all()
