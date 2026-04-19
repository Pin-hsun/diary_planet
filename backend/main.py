"""FastAPI server wrapping JournalAgent for WriteDiary2 frontend."""

import uuid
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

from agent_journal import JournalAgent

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Journal Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

sessions: dict[str, JournalAgent] = {}


def get_agent(sid: str) -> JournalAgent:
    if sid not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    return sessions[sid]


class CreateSessionResponse(BaseModel):
    session_id: str


class CbtRequest(BaseModel):
    input: str
    initial_mood: Optional[str] = None


class ReplyResponse(BaseModel):
    reply: str


class ReframeResponse(BaseModel):
    title: str
    tags: list[str]
    body: str


class SummaryResponse(BaseModel):
    summary: str


class FinalizeReply(BaseModel):
    reply: str
    complete: bool


class NarrativeRequest(BaseModel):
    input: str


class FinalizeRequest(BaseModel):
    input: str


class MoodRequest(BaseModel):
    mood: str


class OkResponse(BaseModel):
    ok: bool


@app.post("/sessions", response_model=CreateSessionResponse)
def create_session():
    sid = str(uuid.uuid4())[:8]
    sessions[sid] = JournalAgent()
    logger.info("Created session %s", sid)
    return {"session_id": sid}


@app.post("/sessions/{sid}/cbt", response_model=ReplyResponse)
def cbt(sid: str, req: CbtRequest):
    agent = get_agent(sid)
    try:
        agent.cbt_receive(req.input, initial_mood=req.initial_mood)
        reply = agent.cbt_reply()
        return {"reply": reply}
    except Exception as e:
        logger.exception("CBT error for session %s", sid)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/sessions/{sid}/reframe", response_model=ReframeResponse)
def reframe(sid: str):
    agent = get_agent(sid)
    try:
        result = agent.reframe()
        return result
    except Exception as e:
        logger.exception("Reframe error for session %s", sid)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/sessions/{sid}/narrative/start", response_model=ReplyResponse)
def narrative_start(sid: str):
    agent = get_agent(sid)
    try:
        reply = agent.start_narrative()
        return {"reply": reply}
    except Exception as e:
        logger.exception("Narrative start error for session %s", sid)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/sessions/{sid}/narrative", response_model=ReplyResponse)
def narrative(sid: str, req: NarrativeRequest):
    agent = get_agent(sid)
    try:
        agent.narrative_receive(req.input)
        reply = agent.narrative_reply()
        return {"reply": reply}
    except Exception as e:
        logger.exception("Narrative error for session %s", sid)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/sessions/{sid}/summarize", response_model=SummaryResponse)
def summarize(sid: str):
    agent = get_agent(sid)
    try:
        summary = agent.summarize()
        return {"summary": summary}
    except Exception as e:
        logger.exception("Summarize error for session %s", sid)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/sessions/{sid}/finalize", response_model=ReplyResponse)
def finalize(sid: str):
    agent = get_agent(sid)
    try:
        reply = agent.finalize()
        return {"reply": reply}
    except Exception as e:
        logger.exception("Finalize error for session %s", sid)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/sessions/{sid}/finalize/chat", response_model=FinalizeReply)
def finalize_chat(sid: str, req: FinalizeRequest):
    agent = get_agent(sid)
    try:
        agent.finalize_receive(req.input)
        reply = agent.finalize_reply()
        return {"reply": reply, "complete": agent.feedback_complete}
    except Exception as e:
        logger.exception("Finalize chat error for session %s", sid)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/sessions/{sid}/mood/final", response_model=OkResponse)
def mood_final(sid: str, req: MoodRequest):
    agent = get_agent(sid)
    agent.set_final_mood(req.mood)
    return {"ok": True}


@app.delete("/sessions/{sid}", response_model=OkResponse)
def delete_session(sid: str):
    if sid in sessions:
        del sessions[sid]
    return {"ok": True}
