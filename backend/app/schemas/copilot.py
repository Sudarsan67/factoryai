"""
Pydantic Schemas for Multilingual Maintenance Co-Pilot (Phase 7)
Subtitle: AI Maintenance Co-Pilot for Textile MSMEs
Languages Supported: English (en), Tamil (ta), Hindi (hi)
"""

from datetime import datetime
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field

LanguageCode = Literal["en", "ta", "hi"]
CopilotIntent = Literal[
    "machine_diagnosis",
    "telemetry_inquiry",
    "prescriptive_sop",
    "xai_explanation",
    "create_work_order",
    "general_inquiry"
]


class ChatMessageRequest(BaseModel):
    query: str = Field(..., min_length=1, example="Why is WVE-03 vibrating? / WVE-03 அதிர்வு ஏன் அதிகமாக உள்ளது?")
    machine_id: Optional[str] = Field("WVE-03", example="WVE-03")
    language: LanguageCode = Field("en", description="'en' for English, 'ta' for Tamil, 'hi' for Hindi")
    user_id: Optional[str] = Field("tech-01", example="tech-01")


class ActionStep(BaseModel):
    step_number: int
    instruction: str
    tool_or_material: Optional[str] = None


class WorkOrderRecommendation(BaseModel):
    machine_id: str
    problem_title: str
    possible_cause: str
    recommended_action: str
    priority_level: Literal["Low", "Medium", "High", "Critical"]
    estimated_repair_time_hrs: float
    estimated_repair_cost_inr: float


class ChatMessageResponse(BaseModel):
    user_query: str
    language: LanguageCode
    intent_detected: CopilotIntent
    confidence_score: float
    machine_id: Optional[str]
    machine_name: Optional[str]
    reply_text: str
    technical_bullets: List[str] = []
    prescriptive_steps: List[str] = []
    work_order: Optional[WorkOrderRecommendation] = None
    created_at: datetime

    class Config:
        from_attributes = True


class WorkOrderCreateRequest(BaseModel):
    machine_id: str
    problem_title: str
    possible_cause: str
    recommended_action: str
    priority_level: Literal["Low", "Medium", "High", "Critical"] = "Medium"
    estimated_repair_time_hrs: float = 2.0
    estimated_repair_cost_inr: float = 1500.0
    assigned_technician: Optional[str] = "S. Ramanathan"


class MaintenanceSOPItem(BaseModel):
    sop_id: str
    title_en: str
    title_ta: str
    title_hi: str
    machine_type: str
    frequency: str
    safety_precautions: List[str]
    steps_en: List[str]
    steps_ta: List[str]
    steps_hi: List[str]
