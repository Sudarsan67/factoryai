"""
Pydantic Schemas for Explainable AI (XAI) Engine (Phase 6)
Subtitle: AI Maintenance Co-Pilot for Textile MSMEs
"""

from datetime import datetime
from typing import Optional, List, Dict, Literal
from pydantic import BaseModel, Field

SeverityLevel = Literal["Nominal", "Elevated", "Warning", "Critical"]

class SensorDeviationItem(BaseModel):
    sensor_name: str = Field(..., description="e.g., Vibration, Temperature, Current, Sound")
    actual_value: float
    normal_value: float
    unit: str
    deviation_percent: float = Field(..., description="((actual - normal) / normal) * 100")
    contribution_weight: float = Field(..., ge=0.0, le=1.0, description="Relative contribution to machine risk (0-1)")
    severity: SeverityLevel
    status_message: str

class XAIExplanationRequest(BaseModel):
    machine_id: str = Field(..., example="WVE-03")
    temperature: float = Field(..., ge=35.0, le=90.0)
    vibration: float = Field(..., ge=0.10, le=2.50)
    current: float = Field(..., ge=2.0, le=15.0)
    sound: float = Field(..., ge=50.0, le=100.0)

class XAIExplanationOut(BaseModel):
    machine_id: str
    machine_name: str
    machine_type: str
    is_at_risk: bool
    risk_level: SeverityLevel
    top_contributing_sensor: str
    top_deviation_percent: float
    diagnosed_root_cause: str
    human_readable_summary: str = Field(
        ...,
        example="Machine at risk: Vibration is 245% above normal, indicating bearing wear."
    )
    technical_rationale: str
    immediate_prescriptive_action: str
    sensor_deviations: List[SensorDeviationItem]
    generated_at: datetime

    class Config:
        from_attributes = True

class FleetXAISummary(BaseModel):
    total_analyzed: int
    at_risk_count: int
    explanations: List[XAIExplanationOut]
    generated_at: datetime
