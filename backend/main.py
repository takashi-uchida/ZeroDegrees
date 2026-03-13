from fastapi import FastAPI
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from contextlib import asynccontextmanager
from urllib.parse import urlparse
from pydantic import BaseModel
from config import settings
from db.session import init_db
from forum.orchestrator import run_discovery
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
