from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    openai_api_key: str
    anthropic_api_key: str
    database_url: str
    frontend_url: str = "http://localhost:3000"
    openai_chat_model: str = "gpt-4o"
    anthropic_model: str = "claude-3-5-sonnet-latest"
    embedding_model: str = "text-embedding-3-small"
    embedding_dimensions: int = 1536
    forum_rounds: int = 2
    max_candidates: int = 10
    
    class Config:
        env_file = Path(__file__).parent.parent / ".env"
        extra = "ignore"

settings = Settings()
