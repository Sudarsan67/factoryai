"""
SQLAlchemy Models for Machine Fleet & Realtime Machine Health
"""

from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()

class Machine(Base):
    __tablename__ = "machines"

    id = Column(String(32), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)
    location_section = Column(String(50), nullable=False)
    rated_power_kw = Column(Float, nullable=False)
    baseline_temp = Column(Float, nullable=False, default=45.0)
    baseline_vib = Column(Float, nullable=False, default=0.40)
    baseline_current = Column(Float, nullable=False, default=5.0)
    baseline_sound = Column(Float, nullable=False, default=65.0)
    manufacturer = Column(String(100), nullable=True)
    model_year = Column(Integer, nullable=True)
    status = Column(String(20), nullable=False, default="Healthy")
    installed_at = Column(DateTime, default=datetime.utcnow)
    last_serviced_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    health_records = relationship("MachineHealth", back_populates="machine", cascade="all, delete-orphan")
    sensor_readings = relationship("SensorReading", back_populates="machine", cascade="all, delete-orphan")
    predictions = relationship("FailurePrediction", back_populates="machine", cascade="all, delete-orphan")
    maintenance_logs = relationship("MaintenanceLog", back_populates="machine", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="machine", cascade="all, delete-orphan")
    cost_analyses = relationship("CostAnalysis", back_populates="machine", cascade="all, delete-orphan")


class MachineHealth(Base):
    __tablename__ = "machine_health"

    id = Column(Integer, primary_key=True, autoincrement=True)
    machine_id = Column(String(32), ForeignKey("machines.id", ondelete="CASCADE"), nullable=False, index=True)
    health_score = Column(Float, nullable=False)  # 0.0 - 100.0
    category = Column(String(20), nullable=False)  # Excellent, Good, Warning, Critical
    temperature_score = Column(Float, nullable=False)
    vibration_score = Column(Float, nullable=False)
    current_score = Column(Float, nullable=False)
    sound_score = Column(Float, nullable=False)
    primary_risk_factor = Column(String(50), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    machine = relationship("Machine", back_populates="health_records")
