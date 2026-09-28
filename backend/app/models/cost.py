"""
SQLAlchemy Model for MSME Business Impact & Downtime Cost Analysis
"""

from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey
from backend.app.models.machine import Base

class CostAnalysis(Base):
    __tablename__ = "cost_analysis"

    id = Column(Integer, primary_key=True, autoincrement=True)
    machine_id = Column(String(32), ForeignKey("machines.id", ondelete="CASCADE"), nullable=False, index=True)
    fault_detected = Column(String(100), nullable=False)
    expected_downtime_hrs = Column(Float, nullable=False)
    production_loss_inr = Column(Float, nullable=False)
    repair_cost_today_inr = Column(Float, nullable=False)
    repair_cost_post_failure_inr = Column(Float, nullable=False)
    estimated_savings_inr = Column(Float, nullable=False)
    roi_multiple = Column(Float, nullable=False)
    calculated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
