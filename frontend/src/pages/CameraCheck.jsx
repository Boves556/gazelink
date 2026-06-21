import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { startCamera, stopCamera, getCameraQualityHints } from '../services/cameraService';
import { initializeMediaPipe, processFrame, resetTrackingStats } from '../services/gazeTrackingService';
import './CameraCheck.css';

export default function CameraCheck() {
  const videoRef = useRef(null);
  const intervalRef = useRef(null);
  const navigate = useNavigate();
  const { setCameraQualityStatus } = useAppContext();
  const [status, setStatus] = useState({
    faceVisible: false,
    lightingAcceptable: false,
    cameraReady: false,
  });
  const [trackingMode, setTrackingMode] = useState('placeholder');
  const [error, setError] = useState('');

  useEffect(() => {
    resetTrackingStats();
    let mounted = true;

    async function setup() {
      try {
        const mp = await initializeMediaPipe();
        if (mounted) setTrackingMode(mp.mode);

        await startCamera(videoRef.current);
        intervalRef.current = window.setInterval(async () => {
          if (!videoRef.current) return;
          const hints = getCameraQualityHints(videoRef.current);
          setStatus(hints);
          await processFrame(videoRef.current);

          const qualityLabel = hints.lightingAcceptable && hints.cameraReady ? 'acceptable' : 'needs_improvement';
          setCameraQualityStatus(qualityLabel);
        }, 500);
      } catch (err) {
        setError(err.message || 'Camera access denied.');
      }
    }

    setup();

    return () => {
      mounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopCamera();
    };
  }, [setCameraQualityStatus]);

  const allReady = status.cameraReady && status.lightingAcceptable;

  return (
    <div className="stack">
      <div className="page-header">
        <h1>Camera Check</h1>
        <p className="muted">
          Allow camera access and confirm the child&apos;s face is visible. Tracking mode:{' '}
          <strong>{trackingMode}</strong>.
        </p>
      </div>

      {error && (
        <div className="card" style={{ borderColor: 'var(--color-danger)' }}>
          <p>{error}</p>
          <p className="small muted">Please enable camera permissions and refresh the page.</p>
        </div>
      )}

      <div className="camera-check-grid">
        <div className="card">
          <div className="camera-preview-wrap">
            <video ref={videoRef} autoPlay playsInline muted />
          </div>
        </div>

        <div className="card stack">
          <h2>Quality checks</h2>
          <ul className="quality-list">
            <li>
              <span className={`quality-dot ${status.faceVisible ? 'ok' : 'warn'}`} />
              Face visible
            </li>
            <li>
              <span className={`quality-dot ${status.lightingAcceptable ? 'ok' : 'warn'}`} />
              Lighting acceptable
            </li>
            <li>
              <span className={`quality-dot ${status.cameraReady ? 'ok' : 'warn'}`} />
              Camera ready
            </li>
          </ul>
          <p className="small muted">
            MediaPipe Face Landmarker can replace the placeholder module in{' '}
            <code>gazeTrackingService.js</code> when ready.
          </p>
          <div className="actions">
            <button
              className="btn btn-primary"
              disabled={!allReady}
              onClick={() => navigate('/parent/game')}
            >
              Start Game
            </button>
            <Link to="/parent/screening" className="btn btn-ghost">
              Back
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
