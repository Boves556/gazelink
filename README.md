# GazeLink: A Gamified Gaze and Pupillometry Screening Support Tool for ADHD

**GazeLink** is a university Human-Computer Interaction / Collaboration Systems prototype. It supports ADHD **screening** (not diagnosis) through a short gamified attention task, browser-based camera tracking, rule-based scoring, and role-specific reports for parents, clinicians, and schools.

> **GazeLink is a university prototype for educational purposes only. It is not a medical device, does not diagnose ADHD, and must not be used for clinical decision-making without proper validation, ethical approval, and regulatory clearance.**

## Purpose

GazeLink explores how a shared digital workspace can help parents, clinicians, and school professionals collaborate around **attention-support screening data** while respecting consent, privacy, and role-appropriate information sharing.

The system never states that a child “has ADHD.” It only reports **attention-support need levels**: low, medium, or high.

## Tech stack

| Layer           | Technologies                                                      |
| --------------- | ----------------------------------------------------------------- |
| Frontend        | React, Vite, React Router, CSS                                    |
| Computer vision | getUserMedia, MediaPipe-ready gaze module (placeholder fallback)  |
| Backend         | Python, FastAPI, Pydantic, Uvicorn, SQLAlchemy                    |
| Database        | PostgreSQL (SQLite fallback for quick testing)                    |
| Scoring         | Rule-based Python module + scikit-learn-compatible ML placeholder |

## Main features

- Role-specific dashboards: **Parent**, **Clinician**, **School**
- Gamified 60-second attention task with reaction-time tracking
- Camera check with quality indicators
- Gaze tracking service structured for MediaPipe Face Landmarker integration
- Rule-based attention-support scoring with confidence percentage
- Clinical report with full metrics and review acknowledgement
- Consent-controlled, de-identified school summary
- **Activity feed** for CSCW transparency (screening completed, consent changed, reports viewed/reviewed)
- Session metadata: ID, timestamp, initiating role, camera quality, consent, report status

## User roles

1. **Parent** — starts screenings, manages consent, views child-friendly results
2. **Clinician** — reviews detailed reports, marks reports as reviewed
3. **School professional** — views simplified educational summary only when consent is granted

## Shared Information Space (CSCW)

GazeLink functions as a **Shared Information Space** because it:

- Preserves screening data and session context over time
- Stores metadata (who initiated the session, consent status, camera quality, report status)
- Provides **role-specific interpretations** of the same underlying session
- Records collaboration events in an activity feed (no “silent documentation”)
- Uses consent to gate what the school can see
- Supports clinician acknowledgement of report review

Future work could include **FHIR-compatible integration** with electronic patient records for validated clinical deployments.

## Architecture overview

```mermaid
flowchart LR
  subgraph Browser
    A[React Frontend]
    B[Camera + Gaze Module]
    C[Attention Game]
  end
  subgraph Backend
    D[FastAPI]
    E[Scoring Service]
    F[Report Service]
  end
  G[(PostgreSQL)]
  A --> B
  A --> C
  A -->|REST JSON| D
  D --> E
  D --> F
  D --> G
```

See [docs/architecture.md](docs/architecture.md) and [docs/api.md](docs/api.md) for details.
Implementation evidence checklist: [docs/implementation_status.md](docs/implementation_status.md).

## Folder structure

```
GazeLink/
├── frontend/          React + Vite app
├── backend/           FastAPI + SQLAlchemy
├── docs/              Architecture & API docs
└── README.md
```

## How to run the frontend

```bash
cd frontend
yarn install
yarn dev
```

Open http://localhost:5173

## Run both together

After you have installed frontend dependencies and created the backend virtual environment once, you can start both services from the project root:

```bash
cd /path/to/gazelink
yarn install
yarn dev
```

This starts:

- backend on http://localhost:8000
- frontend on http://localhost:5173

Prerequisite: the backend virtual environment must already exist at `backend/venv` and have the backend requirements installed.

## How to run the backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

## Database setup

### PostgreSQL (recommended)

```bash
createdb gazelink
```

Set in `backend/.env`:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gazelink
```

### SQLite (quick testing)

In `backend/.env`:

```
DATABASE_URL=sqlite:///./gazelink.db
```

Tables are created automatically on backend startup.

## API endpoints

| Method | Path                             | Description                   |
| ------ | -------------------------------- | ----------------------------- |
| GET    | `/`                              | API status                    |
| POST   | `/sessions`                      | Create screening session      |
| GET    | `/sessions`                      | List sessions                 |
| GET    | `/sessions/{id}`                 | Get session metadata          |
| GET    | `/sessions/{id}/result`          | Get stored result summary     |
| GET    | `/sessions/{id}/activity`        | Activity feed                 |
| POST   | `/sessions/{id}/results`         | Submit game + gaze features   |
| GET    | `/sessions/{id}/clinical-report` | Full clinical report          |
| GET    | `/sessions/{id}/school-summary`  | Consent-gated school summary  |
| POST   | `/sessions/{id}/review`          | Mark report reviewed          |
| POST   | `/consent`                       | Update school sharing consent |

## Demo workflow

1. Start backend (`uvicorn`) and frontend (`yarn dev`)
2. Open the app and choose **Parent**
3. Optionally enable **Allow school summary sharing**
4. Click **Start New Screening** → **Start Camera Check** → allow camera
5. Click **Start Game** and complete the ~60s task (press spacebar on color changes)
6. View the attention-support result on the Result page
7. Open **Clinician Dashboard** → view clinical report → **Mark Reviewed**
8. Open **School Dashboard** → view summary (available only if consent is enabled)
9. Toggle consent on Parent Dashboard and confirm school access changes

## Limitations

- **Not clinically validated** — rule-based thresholds are heuristic demo logic
- Gaze tracking uses a **placeholder module** unless MediaPipe is integrated
- No real authentication or encryption (prototype only)
- No real child names stored — uses de-identified `child_code` / test IDs
- Does not meet medical device or GDPR requirements for production use

Real deployment would require ethical approval, clinical validation, secure authentication, encryption, privacy impact assessment, and regulatory review.

## Future work

- Integrate MediaPipe Face Landmarker for real gaze/pupillometry features
- Replace rule-based scoring with a validated ML model (`ml_model_placeholder.py`)
- Add authentication (OAuth / NHS login / institutional SSO)
- FHIR-compatible EHR export
- Longitudinal tracking across multiple sessions
- Accessibility and multilingual support

## Team contribution section

The project work is divided across four contributors with clear ownership:

| Member      | Primary ownership                                       | Contributions                                                                                                                                       |
| ----------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| SenaDok     | Product coordination, CSCW alignment, final integration | Sprint coordination, integration checks, final demo flow, Shared Information Space narrative quality, final polish of project documentation         |
| udehadaeze  | Frontend UX and attention task experience               | Landing and parent journey UI, game interaction flow, camera check interface, responsive design and usability improvements                          |
| Boves556    | Backend services, data model, scoring                   | FastAPI endpoints, SQLAlchemy models, session and consent logic, rule-based scoring module, ML placeholder integration                              |
| AngelinaNSS | Reports, QA, testing, and demo readiness                | Clinician and school report validation, activity feed verification, backend integration test scenario maintenance, bug triage and release checklist |

## Privacy & regulatory note

This repository is intended for **university coursework and prototyping**. Do not use it with real patient data without institutional ethics approval and appropriate safeguards.
