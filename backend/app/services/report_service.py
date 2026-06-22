from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models import (
    ActivityEvent,
    ActivityEventType,
    ReportStatus,
    ScreeningResult,
    ScreeningSession,
    UserRole,
)
from app.schemas import ClinicalReportResponse, SchoolSummaryResponse


DISCLAIMER = (
    "GazeLink is a university prototype for educational purposes only. "
    "It is not a medical device, does not diagnose ADHD, and must not be used "
    "for clinical decision-making without proper validation, ethical approval, "
    "and regulatory clearance."
)

SCHOOL_SUGGESTIONS = {
    "low": [
        "Maintain clear routines and positive reinforcement for task completion.",
        "Use written instructions alongside verbal directions when helpful.",
    ],
    "medium": [
        "Preferential seating near the teacher with reduced visual distractions.",
        "Break longer assignments into shorter task blocks with check-ins.",
        "Provide structured movement breaks between focused activities.",
    ],
    "high": [
        "Preferential seating and minimized peripheral distractions.",
        "Use shorter task blocks with frequent progress checkpoints.",
        "Provide written step-by-step instructions and visual timers.",
        "Coordinate with family and support staff using agreed strategies only.",
    ],
}


def log_activity(
    db: Session,
    session_id: int,
    event_type: ActivityEventType,
    description: str,
    role: Optional[UserRole] = None,
) -> ActivityEvent:
    event = ActivityEvent(
        session_id=session_id,
        event_type=event_type,
        role=role,
        description=description,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def build_clinical_report(db: Session, session: ScreeningSession, viewer_role: UserRole) -> ClinicalReportResponse:
    result = session.result
    if not result:
        raise ValueError("No screening result available for this session.")

    log_activity(
        db,
        session.id,
        ActivityEventType.clinical_report_viewed,
        f"Clinical report viewed by {viewer_role.value}.",
        role=viewer_role,
    )

    if result.risk_level in ("medium", "high"):
        recommendation = "Further clinical assessment may be considered based on screening indicators."
    else:
        recommendation = "No immediate concern indicated by this screening."

    return ClinicalReportResponse(
        session_id=session.id,
        child_code=session.child_code,
        session_date=session.created_at,
        attention_support_level=result.risk_level,
        confidence_score=result.confidence_score,
        avg_reaction_time=result.avg_reaction_time,
        missed_targets=result.missed_targets,
        wrong_clicks=result.wrong_clicks,
        target_changes=result.target_changes,
        gaze_stability_score=result.gaze_stability_score,
        off_screen_gaze_count=result.off_screen_gaze_count,
        blink_count=result.blink_count,
        tracking_accuracy=result.tracking_accuracy,
        recommendation=recommendation,
        explanation=result.explanation,
        suggested_actions=result.suggested_actions.split("||") if result.suggested_actions else [],
        report_status=session.report_status.value,
        reviewed_at=session.reviewed_at,
        disclaimer=DISCLAIMER,
    )


def build_school_summary(db: Session, session: ScreeningSession, viewer_role: UserRole) -> SchoolSummaryResponse:
    if not session.consent_school_sharing:
        log_activity(
            db,
            session.id,
            ActivityEventType.school_summary_viewed,
            "School summary access attempted without parental consent.",
            role=viewer_role,
        )
        return SchoolSummaryResponse(
            session_id=session.id,
            child_code=session.child_code,
            attention_support_level="low",
            classroom_support_suggestions=[],
            consent_granted=False,
            message="School summary is not available because parental consent has not been granted.",
            disclaimer=DISCLAIMER,
        )

    result = session.result
    if not result:
        raise ValueError("No screening result available for this session.")

    log_activity(
        db,
        session.id,
        ActivityEventType.school_summary_viewed,
        "De-identified school summary viewed.",
        role=viewer_role,
    )

    suggestions = SCHOOL_SUGGESTIONS.get(result.risk_level, SCHOOL_SUGGESTIONS["medium"])

    return SchoolSummaryResponse(
        session_id=session.id,
        child_code=session.child_code,
        attention_support_level=result.risk_level,
        classroom_support_suggestions=suggestions,
        consent_granted=True,
        message=None,
        disclaimer=DISCLAIMER,
    )


def mark_report_reviewed(db: Session, session: ScreeningSession, reviewer_role: UserRole) -> ScreeningSession:
    session.report_status = ReportStatus.reviewed
    session.reviewed_at = datetime.utcnow()
    session.reviewed_by_role = reviewer_role
    db.commit()
    db.refresh(session)

    log_activity(
        db,
        session.id,
        ActivityEventType.report_reviewed,
        f"Report marked as reviewed by {reviewer_role.value}.",
        role=reviewer_role,
    )
    return session
