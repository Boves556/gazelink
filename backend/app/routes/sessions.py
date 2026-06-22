from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    ActivityEventType,
    ReportStatus,
    ScreeningResult,
    ScreeningSession,
    UserRole,
)
from app.schemas import (
    ActivityEventResponse,
    ResultResponse,
    ResultSubmit,
    SessionCreate,
    SessionResponse,
)
from app.scoring.scoring_service import ScoringInput, calculate_attention_support_score
from app.services.report_service import log_activity

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("", response_model=SessionResponse, status_code=201)
def create_session(payload: SessionCreate, db: Session = Depends(get_db)):
    session = ScreeningSession(
        child_code=payload.child_code,
        consent_school_sharing=payload.consent_school_sharing,
        initiated_by_role=UserRole(payload.initiated_by_role),
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    log_activity(
        db,
        session.id,
        ActivityEventType.screening_started,
        f"Screening session started for {session.child_code}.",
        role=UserRole(payload.initiated_by_role),
    )
    return session


@router.get("", response_model=List[SessionResponse])
def list_sessions(db: Session = Depends(get_db)):
    return db.query(ScreeningSession).order_by(ScreeningSession.created_at.desc()).all()


@router.get("/{session_id}", response_model=SessionResponse)
def get_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(ScreeningSession).filter(ScreeningSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.get("/{session_id}/activity", response_model=List[ActivityEventResponse])
def get_session_activity(session_id: int, db: Session = Depends(get_db)):
    session = db.query(ScreeningSession).filter(ScreeningSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return sorted(session.activity_events, key=lambda e: e.created_at, reverse=True)


@router.get("/{session_id}/result", response_model=ResultResponse)
def get_session_result(session_id: int, db: Session = Depends(get_db)):
    session = db.query(ScreeningSession).filter(ScreeningSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if not session.result:
        raise HTTPException(status_code=404, detail="No results for this session")

    result = session.result
    suggested = result.suggested_actions.split("||") if result.suggested_actions else []

    return ResultResponse(
        session_id=session.id,
        risk_level=result.risk_level,
        confidence_score=result.confidence_score,
        explanation=result.explanation,
        suggested_actions=suggested,
        avg_reaction_time=result.avg_reaction_time,
        missed_targets=result.missed_targets,
        wrong_clicks=result.wrong_clicks,
        target_changes=result.target_changes,
        gaze_stability_score=result.gaze_stability_score,
        off_screen_gaze_count=result.off_screen_gaze_count,
        blink_count=result.blink_count,
        tracking_accuracy=result.tracking_accuracy,
        report_status=session.report_status.value,
    )


@router.post("/{session_id}/results", response_model=ResultResponse)
def submit_results(session_id: int, payload: ResultSubmit, db: Session = Depends(get_db)):
    session = db.query(ScreeningSession).filter(ScreeningSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.result:
        raise HTTPException(status_code=400, detail="Results already submitted for this session")

    game = payload.game_metrics
    gaze = payload.gaze_features

    scoring_input = ScoringInput(
        avg_reaction_time=game.avg_reaction_time,
        missed_targets=game.missed_targets,
        wrong_clicks=game.wrong_clicks,
        gaze_stability_score=gaze.gaze_stability_score,
        off_screen_gaze_count=gaze.off_screen_gaze_count,
        tracking_accuracy=gaze.tracking_accuracy,
        blink_count=gaze.blink_count,
        target_changes=game.target_changes,
    )
    score = calculate_attention_support_score(scoring_input)

    session.duration_seconds = game.total_duration_seconds
    session.camera_quality_status = payload.camera_quality_status
    session.report_status = ReportStatus.generated

    result = ScreeningResult(
        session_id=session.id,
        avg_reaction_time=game.avg_reaction_time,
        missed_targets=game.missed_targets,
        wrong_clicks=game.wrong_clicks,
        target_changes=game.target_changes,
        gaze_stability_score=gaze.gaze_stability_score,
        off_screen_gaze_count=gaze.off_screen_gaze_count,
        blink_count=gaze.blink_count,
        tracking_accuracy=gaze.tracking_accuracy,
        risk_level=score.risk_level,
        confidence_score=score.confidence_score,
        explanation=score.explanation,
        suggested_actions="||".join(score.suggested_actions),
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    db.refresh(session)

    log_activity(
        db,
        session.id,
        ActivityEventType.screening_completed,
        f"Screening completed. Attention support level: {score.risk_level}.",
        role=session.initiated_by_role,
    )
    log_activity(
        db,
        session.id,
        ActivityEventType.report_generated,
        "Clinical and role-specific reports generated.",
        role=session.initiated_by_role,
    )

    return ResultResponse(
        session_id=session.id,
        risk_level=score.risk_level,
        confidence_score=score.confidence_score,
        explanation=score.explanation,
        suggested_actions=score.suggested_actions,
        avg_reaction_time=result.avg_reaction_time,
        missed_targets=result.missed_targets,
        wrong_clicks=result.wrong_clicks,
        target_changes=result.target_changes,
        gaze_stability_score=result.gaze_stability_score,
        off_screen_gaze_count=result.off_screen_gaze_count,
        blink_count=result.blink_count,
        tracking_accuracy=result.tracking_accuracy,
        report_status=session.report_status.value,
    )
