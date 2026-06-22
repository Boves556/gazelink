import enum
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class UserRole(str, enum.Enum):
    parent = "parent"
    clinician = "clinician"
    school = "school"


class ReportStatus(str, enum.Enum):
    pending = "pending"
    generated = "generated"
    reviewed = "reviewed"


class ActivityEventType(str, enum.Enum):
    screening_started = "screening_started"
    screening_completed = "screening_completed"
    report_generated = "report_generated"
    consent_changed = "consent_changed"
    clinical_report_viewed = "clinical_report_viewed"
    school_summary_viewed = "school_summary_viewed"
    report_reviewed = "report_reviewed"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    email = Column(String(255), unique=True, nullable=True)

    sessions = relationship("ScreeningSession", back_populates="initiated_by_user")


class ScreeningSession(Base):
    __tablename__ = "screening_sessions"

    id = Column(Integer, primary_key=True, index=True)
    child_code = Column(String(32), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    duration_seconds = Column(Integer, default=0)
    consent_school_sharing = Column(Boolean, default=False, nullable=False)
    initiated_by_role = Column(Enum(UserRole), default=UserRole.parent, nullable=False)
    initiated_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    camera_quality_status = Column(String(64), default="unknown")
    report_status = Column(Enum(ReportStatus), default=ReportStatus.pending, nullable=False)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by_role = Column(Enum(UserRole), nullable=True)

    initiated_by_user = relationship("User", back_populates="sessions")
    result = relationship("ScreeningResult", back_populates="session", uselist=False)
    activity_events = relationship("ActivityEvent", back_populates="session", cascade="all, delete-orphan")


class ScreeningResult(Base):
    __tablename__ = "screening_results"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("screening_sessions.id"), unique=True, nullable=False)
    avg_reaction_time = Column(Float, default=0.0)
    missed_targets = Column(Integer, default=0)
    wrong_clicks = Column(Integer, default=0)
    target_changes = Column(Integer, default=0)
    gaze_stability_score = Column(Float, default=0.0)
    off_screen_gaze_count = Column(Integer, default=0)
    blink_count = Column(Integer, default=0)
    tracking_accuracy = Column(Float, default=0.0)
    risk_level = Column(String(16), default="low")
    confidence_score = Column(Float, default=0.0)
    explanation = Column(Text, default="")
    suggested_actions = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    session = relationship("ScreeningSession", back_populates="result")


class ActivityEvent(Base):
    __tablename__ = "activity_events"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("screening_sessions.id"), nullable=False)
    event_type = Column(Enum(ActivityEventType), nullable=False)
    role = Column(Enum(UserRole), nullable=True)
    description = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    session = relationship("ScreeningSession", back_populates="activity_events")
