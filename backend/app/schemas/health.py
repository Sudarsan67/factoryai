"""
Pydantic Schemas for AI Health Score Engine
Subtitle: AI Maintenance Co-Pilot for Textile MSMEs
Phase 4: Health Score (0-100) & Status Grading
"""

from datetime import datetime
from typing import Optional, Dict, List, Literal
from pydantic import BaseModel, Field

HealthCategoryEnum = Literal["Excellent", "Good", "Warning", "Critical"]

class SubScoreBreakdown(BaseModel):
    temperature_score: float = Field(..., ge=0.0, le=100.0, description="Temperature health index (0-100)")
    vibration_score: float = Field(..., ge=0.0, le=100.0, description="Vibration health index (0-100)")
    current_score: float = Field(..., ge=0.0, le=100.0, description="Current health index (0-100)")
    sound_score: float = Field(..., ge=0.0, le=100.0, description="Sound health index (0-100)")

class HealthCalculationRequest(BaseModel):
    machine_id: str = Field(..., example="WVE-03")
    temperature: float = Field(..., ge=35.0, le=90.0)
    vibration: float = Field(..., ge=0.10, le=2.50)
    current: float = Field(..., ge=2.0, le=15.0)
    sound: float = Field(..., ge=50.0, le=100.0)

class HealthScoreOut(BaseModel):
    machine_id: str
    machine_name: str
    machine_type: str
    health_score: float = Field(..., ge=0.0, le=100.0, description="Composite health index (0-100)")
    category: HealthCategoryEnum
    sub_scores: SubScoreBreakdown
    primary_risk_factor: str
    is_fault_active: bool
    fault_type: Optional[str] = None
    calculated_at: datetime

    class Config:
        from_attributes = True

class MachineHealthSummaryItem(BaseModel):
    machine_id: str
    name: str
    type: str
    health_score: float
    category: HealthCategoryEnum
    status: str
    primary_risk_factor: str

class FleetHealthSummaryOut(BaseModel):
    total_machines: int
    average_fleet_health: float
    excellent_count: int
    good_count: int
    warning_count: int
    critical_count: int
    machines: List[MachineHealthSummaryItem]
    generated_at: datetime
