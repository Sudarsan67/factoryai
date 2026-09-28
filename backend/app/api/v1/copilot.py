"""
FastAPI Router for Multilingual Maintenance Co-Pilot (Phase 7)
Subtitle: AI Maintenance Co-Pilot for Textile MSMEs
Languages: English, Tamil (தமிழ்), Hindi (हिन्दी)
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query, status

from backend.app.schemas.copilot import (
    ChatMessageRequest,
    ChatMessageResponse,
    WorkOrderCreateRequest
)
from backend.app.services.copilot_engine import (
    generate_multilingual_response,
    get_chat_history,
    log_manual_work_order,
    detect_language,
    extract_machine_id,
    TEXTILE_SOPS
)

router = APIRouter(prefix="/copilot", tags=["Multilingual Maintenance Co-Pilot (Phase 7)"])


@router.post("/chat", response_model=Dict[str, Any], summary="Chat with AI Co-Pilot in Tamil, Hindi, or English")
def copilot_chat(payload: ChatMessageRequest):
    """
    Multilingual conversational endpoint for floor technicians and mill supervisors.
    Automatically detects language or honors payload.language parameter.
    Returns technical diagnostic bullets, prescriptive steps, and optional work orders.
    Persists query and reply to SQLite Table 8 (chat_history).
    """
    try:
        lang = payload.language
        if not lang or lang not in ["en", "ta", "hi"]:
            lang = detect_language(payload.query, default="en")

        machine_id = payload.machine_id or extract_machine_id(payload.query, default_id="WVE-03")

        response = generate_multilingual_response(
            query=payload.query,
            machine_id=machine_id,
            language=lang,
            user_id=payload.user_id or "tech-01"
        )
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Co-Pilot inference error: {str(e)}"
        )


@router.get("/history", response_model=List[Dict[str, Any]], summary="Get recent chat interactions")
def fetch_history(limit: int = Query(15, ge=1, le=100)):
    """
    Fetch historical maintenance chat logs from SQLite Table 8 (chat_history).
    """
    try:
        return get_chat_history(limit=limit)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch chat history: {str(e)}"
        )


@router.post("/work-order", response_model=Dict[str, Any], summary="Log maintenance work order to SQLite")
def create_work_order(payload: WorkOrderCreateRequest):
    """
    Log an active maintenance work order into SQLite Table 5 (maintenance_logs).
    """
    try:
        result = log_manual_work_order(
            machine_id=payload.machine_id,
            problem_title=payload.problem_title,
            possible_cause=payload.possible_cause,
            recommended_action=payload.recommended_action,
            priority=payload.priority_level,
            repair_time_hrs=payload.estimated_repair_time_hrs,
            repair_cost_inr=payload.estimated_repair_cost_inr,
            technician=payload.assigned_technician or "S. Ramanathan"
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create work order: {str(e)}"
        )


@router.get("/sops", response_model=List[Dict[str, Any]], summary="Get multilingual textile maintenance SOPs")
def get_sops():
    """
    Returns curated Standard Operating Procedures (SOPs) for bearing replacement and motor thermal mitigation
    in English, Tamil, and Hindi.
    """
    return TEXTILE_SOPS
