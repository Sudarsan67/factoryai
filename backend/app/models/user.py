"""
SQLAlchemy Model for Factory MSME Operators, Supervisors & Mill Owners
"""

from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime
from backend.app.models.machine import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    role = Column(String(30), nullable=False)            # Mill Owner, Maintenance Supervisor, Floor Technician
    whatsapp_number = Column(String(20), nullable=False)
    preferred_language = Column(String(10), nullable=False, default="en") # en, ta, hi
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
