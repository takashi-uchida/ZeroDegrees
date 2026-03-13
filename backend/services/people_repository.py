from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from db.models import Person
from typing import List

class PeopleRepository:
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def find_similar(self, embedding: List[float], limit: int = 10, min_similarity: float = 0.5) -> List[tuple[Person, float]]:
        # Cosine similarity using pgvector: 1 - cosine_distance
        similarity = 1 - Person.embedding.cosine_distance(embedding)
        
        stmt = (
            select(Person, similarity.label("similarity"))
            .where(similarity > min_similarity)
            .order_by(similarity.desc())
            .limit(limit)
        )
        
        result = await self.session.execute(stmt)
        return [(row.Person, row.similarity) for row in result]

    async def find_top_matches(self, embedding: List[float], limit: int = 10) -> List[tuple[Person, float]]:
        similarity = 1 - Person.embedding.cosine_distance(embedding)

        stmt = (
            select(Person, similarity.label("similarity"))
            .order_by(similarity.desc())
            .limit(limit)
        )

        result = await self.session.execute(stmt)
        return [(row.Person, row.similarity) for row in result]
    
    async def get_all(self) -> List[Person]:
        result = await self.session.execute(select(Person))
        return list(result.scalars().all())
