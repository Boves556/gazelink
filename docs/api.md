# GazeLink API Reference

Base URL (development): `http://localhost:8000`

Frontend dev proxy: `/api` → backend root

Interactive docs: http://localhost:8000/docs

## GET /

Health / status check.

**Response**

```json
{
  "status": "ok",
  "service": "GazeLink API",
  "message": "University prototype — not a medical diagnostic device."
}
```

## POST /sessions

Create a new screening session.

**Body**

```json
{
  "child_code": "CHILD-001",
  "initiated_by_role": "parent",
  "consent_school_sharing": false
}
```

**Response** — `SessionResponse` with `id`, metadata, `report_status: "pending"`.

Logs activity: `screening_started`.

## GET /sessions

List all sessions (newest first).

## GET /sessions/{session_id}

Return session metadata.

## GET /sessions/{session_id}/result

Return scored result summary for a completed session.

## GET /sessions/{session_id}/activity

Return activity feed events for the session.

## POST /sessions/{session_id}/results

Submit game and gaze features. Runs scoring and stores result.

**Body**

```json
{
  "game_metrics": {
    "avg_reaction_time": 520.5,
    "missed_targets": 2,
    "wrong_clicks": 1,
    "target_changes": 8,
    "total_duration_seconds": 60,
    "reaction_times": [480, 510, 600]
  },
  "gaze_features": {
    "face_detected": true,
    "gaze_stability_score": 0.78,
    "off_screen_gaze_count": 3,
    "blink_count": 12,
    "tracking_accuracy": 0.81,
    "quality_score": 0.85
  },
  "camera_quality_status": "acceptable"
}
```

Logs activity: `screening_completed`, `report_generated`.

## GET /sessions/{session_id}/clinical-report

Full clinical report. Logs `clinical_report_viewed`.

## GET /sessions/{session_id}/school-summary

De-identified school summary if `consent_school_sharing` is true; otherwise returns consent message.

Logs `school_summary_viewed`.

## POST /sessions/{session_id}/review

Mark report as reviewed by clinician.

**Body**

```json
{ "reviewed_by_role": "clinician" }
```

Logs `report_reviewed`.

## POST /consent

Update school sharing consent.

**Body**

```json
{
  "session_id": 1,
  "consent_school_sharing": true,
  "role": "parent"
}
```

Logs `consent_changed`.

## Error responses

Standard FastAPI errors, e.g.:

- `404` — session or result not found
- `400` — duplicate result submission
