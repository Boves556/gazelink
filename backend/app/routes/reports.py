from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ScreeningSession, UserRole
from app.schemas import ClinicalReportResponse, ReportReviewRequest, ReportReviewResponse, SchoolSummaryResponse
from app.services.report_service import build_clinical_report, build_school_summary, mark_report_reviewed

router = APIRouter(prefix="/sessions", tags=["reports"])


@router.get("/{session_id}/clinical-report", response_model=ClinicalReportResponse)
def get_clinical_report(session_id: int, db: Session = Depends(get_db)):
    session = db.query(ScreeningSession).filter(ScreeningSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    try:
        return build_clinical_report(db, session, UserRole.clinician)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/{session_id}/school-summary", response_model=SchoolSummaryResponse)
def get_school_summary(session_id: int, db: Session = Depends(get_db)):
    session = db.query(ScreeningSession).filter(ScreeningSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if not session.result:
        raise HTTPException(status_code=404, detail="No screening result available for this session.")
    return build_school_summary(db, session, UserRole.school)


@router.post("/{session_id}/review", response_model=ReportReviewResponse)
def review_report(session_id: int, payload: ReportReviewRequest, db: Session = Depends(get_db)):
    session = db.query(ScreeningSession).filter(ScreeningSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if not session.result:
        raise HTTPException(status_code=400, detail="No report available to review")

    reviewer_role = UserRole(payload.reviewed_by_role)
    session = mark_report_reviewed(db, session, reviewer_role)

    return ReportReviewResponse(
        session_id=session.id,
        report_status=session.report_status.value,
        reviewed_at=session.reviewed_at,
        message="Report marked as reviewed. Acknowledgement recorded in activity feed.",
    )
