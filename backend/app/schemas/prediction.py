"""
Pydantic Schemas for Failure Prediction Engine (Phase 5)
Subtitle: AI Maintenance Co-Pilot for Textile MSMEs
"""

from datetime import datetime
from typing import Optional, Dict, List, Literal
from pydantic import BaseModel, Field

PredictionLabelEnum = Literal["Healthy", "Warning", "Critical"]

class PredictionRequest(BaseModel):
    machine_id: str = Field(..., example="WVE-03")
    temperature: float = Field(..., ge=35.0, le=90.0, description="Temperature in °C")
    vibration: float = Field(..., ge=0.10, le=2.50, description="Vibration RMS in g")
    current: float = Field(..., ge=2.0, le=15.0, description="Current in Amperes")
    sound: float = Field(..., ge=50.0, le=100.0, description="Sound in dB")

class ClassProbabilities(BaseModel):
    healthy: float = Field(..., ge=0.0, le=1.0)
    warning: float = Field(..., ge=0.0, le=1.0)
    critical: float = Field(..., ge=0.0, le=1.0)

class PredictionOut(BaseModel):
    machine_id: str
    machine_name: str
    prediction_label: PredictionLabelEnum
    failure_probability: float = Field(..., ge=0.0, le=1.0, description="Probability of impending failure (Warning + Critical)")
    probabilities: ClassProbabilities
    predicted_fault: str
    estimated_rul_hours: float
    model_version: str
    confidence_score: float
    predicted_at: datetime

    class Config:
        from_attributes = True

class ModelTrainingMetrics(BaseModel):
    samples_count: int
    training_accuracy: float
    testing_accuracy: float
    n_estimators: int
    feature_importances: Dict[str, float]
    trained_at: datetime
