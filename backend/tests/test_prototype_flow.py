import os
import sys
from pathlib import Path

# Force test database before importing the FastAPI app.
os.environ["DATABASE_URL"] = "sqlite:///./test_gazelink.db"
os.environ["CORS_ORIGINS"] = "http://localhost:5173"

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from fastapi.testclient import TestClient

from app.main import app


def test_end_to_end_prototype_flow():
    with TestClient(app) as client:
        session_resp = client.post(
            "/sessions",
            json={
                "child_code": "TEST-CHILD-001",
                "initiated_by_role": "parent",
                "consent_school_sharing": False,
            },
        )
        assert session_resp.status_code == 201
        session = session_resp.json()
        session_id = session["id"]

        result_resp = client.post(
            f"/sessions/{session_id}/results",
            json={
                "game_metrics": {
                    "avg_reaction_time": 620.0,
                    "missed_targets": 2,
                    "wrong_clicks": 1,
                    "target_changes": 8,
                    "total_duration_seconds": 60,
                    "reaction_times": [540.0, 620.0, 700.0],
                },
                "gaze_features": {
                    "face_detected": True,
                    "gaze_stability_score": 0.72,
                    "off_screen_gaze_count": 3,
                    "blink_count": 10,
                    "tracking_accuracy": 0.81,
                    "quality_score": 0.84,
                },
                "camera_quality_status": "acceptable",
            },
        )
        assert result_resp.status_code == 200
        result = result_resp.json()
        assert result["risk_level"] in {"low", "medium", "high"}
        assert 0 <= result["confidence_score"] <= 100

        clinical_resp = client.get(f"/sessions/{session_id}/clinical-report")
        assert clinical_resp.status_code == 200
        clinical = clinical_resp.json()
        assert "recommendation" in clinical

        school_before_consent = client.get(f"/sessions/{session_id}/school-summary")
        assert school_before_consent.status_code == 200
        summary_before = school_before_consent.json()
        assert summary_before["consent_granted"] is False

        consent_resp = client.post(
            "/consent",
            json={
                "session_id": session_id,
                "consent_school_sharing": True,
                "role": "parent",
            },
        )
        assert consent_resp.status_code == 200

        school_after_consent = client.get(f"/sessions/{session_id}/school-summary")
        assert school_after_consent.status_code == 200
        summary_after = school_after_consent.json()
        assert summary_after["consent_granted"] is True
        assert len(summary_after["classroom_support_suggestions"]) > 0

        review_resp = client.post(
            f"/sessions/{session_id}/review",
            json={"reviewed_by_role": "clinician"},
        )
        assert review_resp.status_code == 200
        reviewed = review_resp.json()
        assert reviewed["report_status"] == "reviewed"

        activity_resp = client.get(f"/sessions/{session_id}/activity")
        assert activity_resp.status_code == 200
        events = activity_resp.json()
        event_types = {event["event_type"] for event in events}
        assert "screening_started" in event_types
        assert "screening_completed" in event_types
        assert "report_generated" in event_types
        assert "consent_changed" in event_types
        assert "report_reviewed" in event_types
