"""
SQLAlchemy Models for Failure Predictions & Prescriptive Maintenance Logs
"""

from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, Index
from backend.app.models.machine import Base

class FailurePrediction(Base):
    __tablename__ = "failure_predictions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    machine_id = Column(String(32), ForeignKey("machines.id", ondelete="CASCADE"), nullable=False, index=True)
    prediction_label = Column(String(20), nullable=False)  # Healthy, Warning, Critical
    failure_probability = Column(Float, nullable=False)    # 0.0 - 1.0
    predicted_fault = Column(String(100), nullable=True)
    estimated_rul_hours = Column(Float, nullable=True)
    xai_primary_factor = Column(String(50), nullable=True)
    xai_explanation_json = Column(Text, nullable=False)
    predicted_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    __table_args__ = (
        Index("idx_predictions_machine_time", "machine_id", "predicted_at"),
    )


class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    machine_id = Column(String(32), ForeignKey("machines.id", ondelete="CASCADE"), nullable=False, index=True)
    problem_title = Column(String(150), nullable=False)
    possible_cause = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=False)
    priority_level = Column(String(20), nullable=False, default="Medium")  # Low, Medium, High, Critical
    estimated_repair_time_hrs = Column(Float, nullable=False)
    estimated_repair_cost_inr = Column(Float, nullable=False)
    status = Column(String(20), nullable=False, default="Pending")         # Pending, In Progress, Resolved
    assigned_technician = Column(String(100), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
