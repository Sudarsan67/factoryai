"""
SQLAlchemy Models for WhatsApp Alerts & Conversational Chat History
"""

from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from backend.app.models.machine import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    machine_id = Column(String(32), ForeignKey("machines.id", ondelete="CASCADE"), nullable=False, index=True)
    alert_title = Column(String(150), nullable=False)
    severity = Column(String(20), nullable=False)  # Info, Warning, Critical
    message_content = Column(Text, nullable=False)
    whatsapp_dispatched = Column(Boolean, default=True, nullable=False)
    recipient_phone = Column(String(20), nullable=False)
    is_acknowledged = Column(Boolean, default=False, nullable=False)
    acknowledged_by = Column(String(100), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(50), nullable=False, index=True)
    machine_id = Column(String(32), ForeignKey("machines.id", ondelete="SET NULL"), nullable=True)
    user_query = Column(Text, nullable=False)
    bot_response = Column(Text, nullable=False)
    intent_detected = Column(String(50), nullable=False)
    confidence_score = Column(Float, default=1.0)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
