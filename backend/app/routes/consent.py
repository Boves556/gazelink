from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ActivityEventType, ScreeningSession, UserRole
from app.schemas import ConsentResponse, ConsentUpdate
from app.services.report_service import log_activity

router = APIRouter(prefix="/consent", tags=["consent"])


@router.post("", response_model=ConsentResponse)
def update_consent(payload: ConsentUpdate, db: Session = Depends(get_db)):
    session = db.query(ScreeningSession).filter(ScreeningSession.id == payload.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.consent_school_sharing = payload.consent_school_sharing
    db.commit()
    db.refresh(session)

    status = "granted" if payload.consent_school_sharing else "revoked"
    log_activity(
        db,
        session.id,
        ActivityEventType.consent_changed,
        f"School summary sharing consent {status}.",
        role=UserRole(payload.role),
    )

    return ConsentResponse(
        session_id=session.id,
        consent_school_sharing=session.consent_school_sharing,
        message=f"Consent updated. School sharing is now {'enabled' if session.consent_school_sharing else 'disabled'}.",
    )
