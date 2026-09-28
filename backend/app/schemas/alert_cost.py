"""
Pydantic Schemas for Smart Alerts & Financial ROI Cost Analysis (Phase 8)
Subtitle: AI Maintenance Co-Pilot for Textile MSMEs
"""

from datetime import datetime
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field

AlertSeverity = Literal["Info", "Warning", "Critical"]


class SmartAlertItem(BaseModel):
    id: Optional[int] = None
    machine_id: str
    machine_name: Optional[str] = None
    alert_title: str
    severity: AlertSeverity
    message_content: str
    whatsapp_dispatched: bool = True
    recipient_phone: str = "+91 98421 78920"
    is_acknowledged: bool = False
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    created_at: datetime


class AlertAcknowledgeRequest(BaseModel):
    alert_id: int
    acknowledged_by: str = Field(..., example="S. Ramanathan (Chief Technician)")


class CostAnalysisItem(BaseModel):
    id: Optional[int] = None
    machine_id: str
    machine_name: Optional[str] = None
    fault_detected: str
    expected_downtime_hrs: float
    production_loss_inr: float
    repair_cost_today_inr: float
    repair_cost_post_failure_inr: float
    estimated_savings_inr: float
    roi_multiple: float
    calculated_at: datetime


class ROICalculatorRequest(BaseModel):
    machine_id: str = "WVE-03"
    hourly_production_loss_inr: float = Field(2500.0, ge=500.0, le=20000.0)
    unplanned_downtime_hrs: float = Field(24.0, ge=4.0, le=120.0)
    preventive_downtime_hrs: float = Field(2.5, ge=0.5, le=12.0)
    preventive_repair_cost_inr: float = Field(3500.0, ge=500.0, le=50000.0)
    catastrophic_repair_cost_inr: float = Field(52000.0, ge=5000.0, le=250000.0)


class ROICalculatorResponse(BaseModel):
    machine_id: str
    catastrophic_total_loss_inr: float
    preventive_total_cost_inr: float
    net_savings_inr: float
    roi_multiple: float
    payback_days: float
    summary: str
