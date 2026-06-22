from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


RiskLevel = Literal["low", "medium", "high"]
UserRoleType = Literal["parent", "clinician", "school"]
ReportStatusType = Literal["pending", "generated", "reviewed"]


class UserCreate(BaseModel):
    name: str
    role: UserRoleType
    email: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    name: str
    role: UserRoleType
    email: Optional[str] = None

    class Config:
        from_attributes = True


class SessionCreate(BaseModel):
    child_code: str = Field(default="CHILD-001", max_length=32)
    initiated_by_role: UserRoleType = "parent"
    consent_school_sharing: bool = False


class SessionResponse(BaseModel):
    id: int
    child_code: str
    created_at: datetime
    duration_seconds: int
    consent_school_sharing: bool
    initiated_by_role: UserRoleType
    camera_quality_status: str
    report_status: ReportStatusType
    reviewed_at: Optional[datetime] = None
    reviewed_by_role: Optional[UserRoleType] = None

    class Config:
        from_attributes = True


class GameMetrics(BaseModel):
    avg_reaction_time: float = 0.0
    missed_targets: int = 0
    wrong_clicks: int = 0
    target_changes: int = 0
    total_duration_seconds: int = 60
    reaction_times: List[float] = Field(default_factory=list)


class GazeFeatures(BaseModel):
    face_detected: bool = True
    gaze_stability_score: float = 0.0
    off_screen_gaze_count: int = 0
    blink_count: int = 0
    tracking_accuracy: float = 0.0
    quality_score: float = 0.0


class ResultSubmit(BaseModel):
    game_metrics: GameMetrics
    gaze_features: GazeFeatures
    camera_quality_status: str = "acceptable"


class ScoringOutput(BaseModel):
    risk_level: RiskLevel
    confidence_score: float
    explanation: str
    suggested_actions: List[str]


class ResultResponse(BaseModel):
    session_id: int
    risk_level: RiskLevel
    confidence_score: float
    explanation: str
    suggested_actions: List[str]
    avg_reaction_time: float
    missed_targets: int
    wrong_clicks: int
    target_changes: int
    gaze_stability_score: float
    off_screen_gaze_count: int
    blink_count: int
    tracking_accuracy: float
    report_status: ReportStatusType


class ConsentUpdate(BaseModel):
    session_id: int
    consent_school_sharing: bool
    role: UserRoleType = "parent"


class ConsentResponse(BaseModel):
    session_id: int
    consent_school_sharing: bool
    message: str


class ActivityEventResponse(BaseModel):
    id: int
    session_id: int
    event_type: str
    role: Optional[UserRoleType] = None
    description: str
    created_at: datetime

    class Config:
        from_attributes = True


class ClinicalReportResponse(BaseModel):
    session_id: int
    child_code: str
    session_date: datetime
    attention_support_level: RiskLevel
    confidence_score: float
    avg_reaction_time: float
    missed_targets: int
    wrong_clicks: int
    target_changes: int
    gaze_stability_score: float
    off_screen_gaze_count: int
    blink_count: int
    tracking_accuracy: float
    recommendation: str
    explanation: str
    suggested_actions: List[str]
    report_status: ReportStatusType
    reviewed_at: Optional[datetime] = None
    disclaimer: str


class SchoolSummaryResponse(BaseModel):
    session_id: int
    child_code: str
    attention_support_level: RiskLevel
    classroom_support_suggestions: List[str]
    consent_granted: bool
    message: Optional[str] = None
    disclaimer: str


class ReportReviewRequest(BaseModel):
    reviewed_by_role: UserRoleType = "clinician"


class ReportReviewResponse(BaseModel):
    session_id: int
    report_status: ReportStatusType
    reviewed_at: Optional[datetime] = None
    message: str
