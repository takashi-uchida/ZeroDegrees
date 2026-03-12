from openai import AsyncOpenAI
from config import settings

client = AsyncOpenAI(api_key=settings.openai_api_key)

async def get_embedding(text: str) -> list[float]:
    response = await client.embeddings.create(
        model=settings.embedding_model,
        input=text
    )
    return response.data[0].embedding

async def get_embeddings_batch(texts: list[str]) -> list[list[float]]:
    response = await client.embeddings.create(
        model=settings.embedding_model,
        input=texts
    )
    return [item.embedding for item in response.data]
