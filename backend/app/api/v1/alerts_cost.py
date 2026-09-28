"""
FastAPI Router for Smart Alerts & Financial ROI Cost Analysis (Phase 8)
Subtitle: AI Maintenance Co-Pilot for Textile MSMEs
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query, status

from backend.app.schemas.alert_cost import (
    SmartAlertItem,
    AlertAcknowledgeRequest,
    CostAnalysisItem,
    ROICalculatorRequest,
    ROICalculatorResponse
)
from backend.app.services.alert_cost_engine import (
    dispatch_smart_alert,
    acknowledge_alert,
    get_all_alerts,
    calculate_machine_roi,
    get_fleet_roi_summary,
    record_cost_analysis
)

router = APIRouter(prefix="/alerts-cost", tags=["Smart Alerts & Financial ROI (Phase 8)"])


@router.post("/alerts/dispatch", response_model=Dict[str, Any], summary="Dispatch smart automated alert to WhatsApp")
def dispatch_alert_endpoint(
    machine_id: str = Query("WVE-03"),
    alert_title: str = Query("Severe Bearing Vibration Warning"),
    severity: str = Query("Critical"),
    language: str = Query("en")
):
    """
    Automated notification generator simulating WhatsApp dispatch to floor technician / mill owner.
    Persists alert record into SQLite Table 6 (alerts).
    """
    try:
        return dispatch_smart_alert(
            machine_id=machine_id,
            alert_title=alert_title,
            severity=severity,
            language=language
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Alert dispatch failed: {str(e)}"
        )


@router.get("/alerts/list", response_model=List[Dict[str, Any]], summary="List recently dispatched WhatsApp alerts")
def list_alerts(limit: int = Query(15, ge=1, le=100)):
    """
    Retrieve real-time and historical alert dispatch records from SQLite Table 6.
    """
    try:
        return get_all_alerts(limit=limit)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch alerts: {str(e)}"
        )


@router.post("/alerts/acknowledge", response_model=Dict[str, Any], summary="Acknowledge alert by technician")
def acknowledge_alert_endpoint(payload: AlertAcknowledgeRequest):
    """
    Mark an active alert as acknowledged with technician name and timestamp in SQLite.
    """
    try:
        return acknowledge_alert(
            alert_id=payload.alert_id,
            technician=payload.acknowledged_by
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to acknowledge alert: {str(e)}"
        )


@router.get("/cost/machine/{machine_id}", response_model=Dict[str, Any], summary="Get ROI cost analysis for specific machine")
def get_machine_cost(machine_id: str):
    """
    Calculate and record Financial ROI and downtime cost avoidance in Indian Rupees (₹)
    for a specific textile plant asset in SQLite Table 7 (cost_analysis).
    """
    try:
        return record_cost_analysis(machine_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cost analysis for '{machine_id}' failed: {str(e)}"
        )


@router.get("/cost/fleet", response_model=Dict[str, Any], summary="Get fleet-wide Financial ROI summary")
def get_fleet_cost_summary():
    """
    Retrieve aggregate financial savings, total downtime prevented, and ROI multiple
    across the entire 6-machine textile mill fleet.
    """
    try:
        return get_fleet_roi_summary()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fleet ROI summary failed: {str(e)}"
        )


@router.post("/cost/calculate", response_model=Dict[str, Any], summary="Simulate custom Financial ROI calculation")
def calculate_custom_roi(payload: ROICalculatorRequest):
    """
    Interactive what-if economic simulator allowing mill owners to test custom hourly production loss rates,
    preventive vs catastrophic repair costs, and downtime durations.
    """
    try:
        return calculate_machine_roi(
            machine_id=payload.machine_id,
            custom_hourly_loss=payload.hourly_production_loss_inr,
            custom_unplanned_hrs=payload.unplanned_downtime_hrs,
            custom_preventive_hrs=payload.preventive_downtime_hrs,
            custom_preventive_cost=payload.preventive_repair_cost_inr,
            custom_catastrophic_cost=payload.catastrophic_repair_cost_inr
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Custom ROI simulation failed: {str(e)}"
        )
