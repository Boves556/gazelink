# GazeLink Frontend

React + Vite frontend for the GazeLink screening support prototype.

To run both frontend and backend together from the project root, use the root command documented in [../README.md](../README.md).

## Setup

```bash
cd frontend
yarn install
```

Optional: create `.env` to point directly at the API (proxy is configured by default):

```
VITE_API_URL=http://localhost:8000
```

## Run

```bash
yarn dev
```

Open http://localhost:5173

The dev server proxies `/api/*` to `http://localhost:8000`.

## Key modules

- `src/services/cameraService.js` — getUserMedia camera access
- `src/services/gazeTrackingService.js` — MediaPipe-ready placeholder tracking
- `src/services/api.js` — backend API client
- `src/pages/AttentionGame.jsx` — gamified 60-second attention task
