from openai import AsyncOpenAI
from config import settings
from forum.schemas import UserContext
from services.embeddings import get_embedding
import json

client = AsyncOpenAI(api_key=settings.openai_api_key)

async def analyze_context(query: str) -> UserContext:
    prompt = f"""Extract structured context from this user query:

Query: {query}

Return a JSON object with:
- situation: brief description of current situation
- goals: list of goals/aspirations
- obstacles: list of challenges/blockers
- emotional_context: emotional state or motivation

Return only valid JSON, no other text."""

    response = await client.chat.completions.create(
        model=settings.openai_chat_model,
        max_tokens=1024,
        response_format={"type": "json_object"},
        messages=[{"role": "user", "content": prompt}]
    )
    
    result = json.loads(response.choices[0].message.content)
    
    # Generate embedding
    embedding_text = f"{result['situation']} {' '.join(result['goals'])} {' '.join(result['obstacles'])}"
    embedding = await get_embedding(embedding_text)
    
    return UserContext(**result, embedding=embedding)
