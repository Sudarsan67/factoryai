"""
FastAPI Router for Explainable AI (XAI) Engine (Phase 6)
Subtitle: AI Maintenance Co-Pilot for Textile MSMEs
"""

from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, status

from backend.app.schemas.xai import (
    XAIExplanationRequest,
    XAIExplanationOut,
    FleetXAISummary
)
from backend.app.services.xai_engine import (
    explain_machine_telemetry,
    explain_machine_from_db,
    explain_fleet,
    get_machine_baseline,
    DEFAULT_BASELINES
)

router = APIRouter(prefix="/xai", tags=["Explainable AI Engine (Phase 6)"])


@router.post("/explain", response_model=Dict[str, Any], summary="Explain risk factors from arbitrary telemetry")
def explain_telemetry(payload: XAIExplanationRequest):
    """
    Computes percentage deviation against baseline, identifies top contributing sensor,
    diagnoses mechanical/electrical root cause, and generates natural language explanation.
    """
    try:
        explanation = explain_machine_telemetry(
            machine_id=payload.machine_id,
            temperature=payload.temperature,
            vibration=payload.vibration,
            current=payload.current,
            sound=payload.sound,
            persist_explanation=False
        )
        return explanation
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"XAI calculation failed: {str(e)}"
        )


@router.get("/machine/{machine_id}", response_model=Dict[str, Any], summary="Explain risk factors for specific machine")
def explain_machine(machine_id: str):
    """
    Retrieve latest sensor readings for machine from SQLite, compare against rated baselines,
    and generate explainable attribution & prescriptive maintenance actions.
    """
    try:
        return explain_machine_from_db(machine_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Machine '{machine_id}' XAI explanation failed: {str(e)}"
        )


@router.get("/fleet", response_model=List[Dict[str, Any]], summary="Generate XAI breakdown across entire textile fleet")
def explain_fleet_endpoint():
    """
    Returns explainable AI diagnostics and baseline deviations for all machines in the textile mill.
    """
    try:
        return explain_fleet()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fleet XAI evaluation failed: {str(e)}"
        )


@router.get("/baselines", response_model=Dict[str, Any], summary="Get nominal baselines and operational tolerances")
def get_baselines():
    """
    Returns baseline vibration, temperature, current, and sound ratings for textile machinery.
    """
    return {
        "count": len(DEFAULT_BASELINES),
        "tolerance_percent": 15.0,
        "warning_threshold_percent": 50.0,
        "critical_threshold_percent": 100.0,
        "baselines": DEFAULT_BASELINES
    }
