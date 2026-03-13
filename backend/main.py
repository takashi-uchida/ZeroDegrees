from fastapi import FastAPI, Depends
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from contextlib import asynccontextmanager
from urllib.parse import urlparse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from config import settings
from db.session import init_db, get_db
from forum.orchestrator import run_discovery
from services.relationship_repository import RelationshipRepository
from uuid import UUID
import json

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(title="ZeroDegrees API", lifespan=lifespan)


def build_allowed_origins(frontend_url: str) -> list[str]:
    parsed = urlparse(frontend_url)
    if not parsed.scheme or not parsed.hostname:
        return [frontend_url]

    origins = {frontend_url}
    port = f":{parsed.port}" if parsed.port else ""
    host_variants = {parsed.hostname}

    if parsed.hostname == "localhost":
        host_variants.add("127.0.0.1")
    elif parsed.hostname == "127.0.0.1":
        host_variants.add("localhost")

    for hostname in host_variants:
        origins.add(f"{parsed.scheme}://{hostname}{port}")

    return sorted(origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=build_allowed_origins(settings.frontend_url),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DiscoveryRequest(BaseModel):
    query: str

class HelpRequest(BaseModel):
    helper_id: UUID
    helped_id: UUID
    description: str
    impact_score: float = 1.0

class ThanksRequest(BaseModel):
    from_person_id: UUID
    to_person_id: UUID
    help_history_id: UUID
    amount: int = 1
    message: str = None

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/api/discover")
async def discover(request: DiscoveryRequest):
    async def event_stream():
        async for event in run_discovery(request.query):
            yield f"data: {json.dumps(jsonable_encoder(event))}\n\n"
    
    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )

@app.post("/api/relationships/help")
async def add_help(request: HelpRequest, db: AsyncSession = Depends(get_db)):
    repo = RelationshipRepository(db)
    help_record = await repo.add_help(request.helper_id, request.helped_id, request.description, request.impact_score)
    trust_score = await repo.get_trust_score(request.helper_id, request.helped_id)
    return {"id": str(help_record.id), "trust_score": trust_score}

@app.post("/api/relationships/thanks")
async def send_thanks(request: ThanksRequest, db: AsyncSession = Depends(get_db)):
    repo = RelationshipRepository(db)
    token = await repo.send_thanks(request.from_person_id, request.to_person_id, request.help_history_id, request.amount, request.message)
    trust_score = await repo.get_trust_score(request.from_person_id, request.to_person_id)
    return {"id": str(token.id), "trust_score": trust_score}

@app.get("/api/relationships/{person_a_id}/{person_b_id}/trust")
async def get_trust_score(person_a_id: UUID, person_b_id: UUID, db: AsyncSession = Depends(get_db)):
    repo = RelationshipRepository(db)
    trust_score = await repo.get_trust_score(person_a_id, person_b_id)
    return {"trust_score": trust_score}

@app.get("/api/relationships/{person_a_id}/{person_b_id}/history")
async def get_help_history(person_a_id: UUID, person_b_id: UUID, db: AsyncSession = Depends(get_db)):
    repo = RelationshipRepository(db)
    history = await repo.get_help_history(person_a_id, person_b_id)
    return [{"id": str(h.id), "helper_id": str(h.helper_id), "helped_id": str(h.helped_id), "description": h.description, "impact_score": h.impact_score, "created_at": h.created_at.isoformat()} for h in history]
