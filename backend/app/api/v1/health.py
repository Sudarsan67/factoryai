"""
FastAPI Endpoints for Machine Health Score Engine (Phase 4)
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
import sqlite3
import os

from backend.app.schemas.health import (
    HealthScoreOut,
    FleetHealthSummaryOut,
    HealthCalculationRequest
)
from backend.app.services.health_engine import health_engine, DB_PATH

router = APIRouter(prefix="/health", tags=["Health Engine"])

@router.get("/fleet/summary", response_model=FleetHealthSummaryOut)
def get_fleet_health_summary():
    """
    Get aggregated fleet health summary for textile plant.
    Includes machine counts by category (Excellent, Good, Warning, Critical)
    and average health index.
    """
    summary = health_engine.get_fleet_summary()
    return summary

@router.get("/{machine_id}", response_model=HealthScoreOut)
def get_machine_health(machine_id: str):
    """
    Get live calculated health score (0-100), grading category,
    and sub-scores for a specific machine asset.
    """
    res = health_engine.evaluate_machine_from_db(machine_id)
    if not res:
        raise HTTPException(status_code=404, detail=f"Machine '{machine_id}' not found.")
    return res

@router.post("/compute", response_model=Dict[str, Any])
def compute_ad_hoc_health(payload: HealthCalculationRequest):
    """
    Calculate health score for simulated or custom sensor values.
    Returns composite score, category, sub-scores, and primary risk factor.
    """
    result = health_engine.calculate_health(
        machine_id=payload.machine_id,
        temperature=payload.temperature,
        vibration=payload.vibration,
        current=payload.current,
        sound=payload.sound
    )
    return result

@router.get("/history/{machine_id}", response_model=List[Dict[str, Any]])
def get_machine_health_history(machine_id: str, limit: int = 30):
    """
    Get historical calculated health scores from `machine_health` table.
    """
    if not os.path.exists(DB_PATH):
        raise HTTPException(status_code=500, detail="Database not initialized.")

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, machine_id, health_score, category, temperature_score,
                   vibration_score, current_score, sound_score,
                   primary_risk_factor, updated_at
            FROM machine_health
            WHERE machine_id = ?
            ORDER BY updated_at DESC, id DESC
            LIMIT ?;
        """, (machine_id, limit))
        rows = cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()
