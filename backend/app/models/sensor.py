"""
SQLAlchemy Model for 5-Second IoT Sensor Telemetry Stream
"""

from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Index
from backend.app.models.machine import Base

class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    machine_id = Column(String(32), ForeignKey("machines.id", ondelete="CASCADE"), nullable=False, index=True)
    temperature = Column(Float, nullable=False)   # Range: 35.0 - 90.0 °C
    vibration = Column(Float, nullable=False)     # Range: 0.1 - 2.5 g
    current = Column(Float, nullable=False)       # Range: 2.0 - 15.0 A
    sound = Column(Float, nullable=False)         # Range: 50.0 - 100.0 dB
    is_fault_injected = Column(Boolean, default=False, nullable=False)
    fault_type = Column(String(50), nullable=True)
    recorded_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    machine = relationship = None  # Populated via machine.py back_populates

    __table_args__ = (
        Index("idx_sensor_readings_machine_time", "machine_id", "recorded_at"),
    )
