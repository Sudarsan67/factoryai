"""
Pydantic Schemas for IoT Telemetry & Fault Injection
"""

from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field

MachineTypeEnum = Literal[
    "Spinning Machine",
    "Weaving Loom",
    "Knitting Machine",
    "Dyeing Machine",
    "Industrial Motor",
    "Compressor"
]

FaultTypeEnum = Literal[
    "Motor Overheating",
    "Bearing Wear",
    "High Current Draw",
    "Excessive Noise",
    "Misalignment",
    "Loose Components"
]

class SensorReadingBase(BaseModel):
    machine_id: str = Field(..., example="WVE-03")
    temperature: float = Field(..., ge=35.0, le=90.0, description="Temperature in °C (35 - 90)")
    vibration: float = Field(..., ge=0.1, le=2.5, description="Vibration RMS in g (0.1 - 2.5)")
    current: float = Field(..., ge=2.0, le=15.0, description="Current draw in Amperes (2 - 15)")
    sound: float = Field(..., ge=50.0, le=100.0, description="Acoustic loudness in dB (50 - 100)")
    is_fault_injected: bool = Field(default=False)
    fault_type: Optional[FaultTypeEnum] = None

class SensorReadingCreate(SensorReadingBase):
    pass

class SensorReadingOut(SensorReadingBase):
    id: int
    recorded_at: datetime

    class Config:
        from_attributes = True

class FaultInjectionRequest(BaseModel):
    machine_id: str = Field(..., example="WVE-03")
    fault_type: FaultTypeEnum = Field(..., example="Bearing Wear")
    duration_seconds: int = Field(default=60, ge=5, le=3600, description="Duration to keep fault active")

class SimulatorStatus(BaseModel):
    is_running: bool
    interval_seconds: float = 5.0
    active_machines: list[str]
    active_faults: dict[str, str]
    total_ticks: int
    last_tick_at: Optional[datetime]
