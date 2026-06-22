# GazeLink Backend

FastAPI backend for the GazeLink ADHD screening support prototype.

## Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

## Database

### PostgreSQL (recommended)

```bash
createdb gazelink
# Edit .env:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gazelink
```

### SQLite (quick testing)

Uncomment the SQLite line in `.env`:

```
DATABASE_URL=sqlite:///./gazelink.db
```

Tables are created automatically on startup.

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | API status |
| POST | `/sessions` | Create screening session |
| GET | `/sessions` | List all sessions |
| GET | `/sessions/{id}` | Get one session |
| GET | `/sessions/{id}/result` | Get stored result summary |
| GET | `/sessions/{id}/activity` | Activity feed |
| POST | `/sessions/{id}/results` | Submit game + gaze data |
| GET | `/sessions/{id}/clinical-report` | Full clinical report |
| GET | `/sessions/{id}/school-summary` | Consent-gated school summary |
| POST | `/sessions/{id}/review` | Mark report as reviewed |
| POST | `/consent` | Update school sharing consent |
