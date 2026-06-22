# GazeLink Architecture

## Overview

GazeLink is a monorepo with a React frontend and FastAPI backend connected via REST JSON over HTTP. The frontend captures behavioural and gaze-proxy features during a gamified attention task; the backend scores them, persists results, and serves role-specific reports.

## Components

### Frontend (`frontend/`)

| Module | Responsibility |
|--------|----------------|
| `pages/` | Role dashboards, screening flow, reports |
| `services/cameraService.js` | getUserMedia lifecycle, brightness heuristics |
| `services/gazeTrackingService.js` | MediaPipe-ready tracking; placeholder fallback |
| `services/api.js` | REST client (proxied via Vite in dev) |
| `context/AppContext.jsx` | Role, session, consent, local persistence |

### Backend (`backend/app/`)

| Module | Responsibility |
|--------|----------------|
| `routes/sessions.py` | Session CRUD, result submission, activity feed |
| `routes/reports.py` | Clinical report, school summary, review acknowledgement |
| `routes/consent.py` | Parent consent updates |
| `scoring/scoring_service.py` | Rule-based attention-support scoring |
| `scoring/ml_model_placeholder.py` | sklearn-compatible future ML hook |
| `services/report_service.py` | Report builders, activity logging, review status |

### Database

- **PostgreSQL** (target production-like setup)
- **SQLite** fallback via `DATABASE_URL`

Models:

- `User` — optional prototype user record
- `ScreeningSession` — metadata, consent, report status
- `ScreeningResult` — metrics and scored output
- `ActivityEvent` — CSCW collaboration audit trail

## Data flow

1. Parent creates a session (`POST /sessions`)
2. Frontend runs camera check and attention game
3. Game + gaze features posted to `POST /sessions/{id}/results`
4. Backend runs `calculate_attention_support_score()` and stores result
5. Activity events logged (`screening_completed`, `report_generated`)
6. Parent views summary; clinician views full report; school views consent-gated summary
7. Clinician marks report reviewed → `report_reviewed` activity event

## CSCW / Shared Information Space

GazeLink implements a shared information space by:

1. **Common repository** — sessions and results in PostgreSQL
2. **Metadata** — timestamps, roles, consent, camera quality, report status
3. **Role-specific views** — same session, different presentation
4. **Activity feed** — visible collaboration history
5. **Acknowledgement** — clinician review prevents silent documentation
6. **Consent gate** — school access bounded by parent choice

## Security prototype gaps

For coursework/demo only:

- No auth tokens
- No field-level encryption
- No audit log immutability
- CORS limited to local dev origins

## Extension points

- Set `USE_MEDIAPIPE = true` in `gazeTrackingService.js` and add `@mediapipe/tasks-vision`
- Swap `calculate_attention_support_score` with trained model from `ml_model_placeholder.py`
- Add FHIR Observation resources for EHR integration
