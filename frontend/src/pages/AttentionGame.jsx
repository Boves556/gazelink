import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { submitResults } from '../services/api';
import { getActiveStream } from '../services/cameraService';
import { getTrackingFeatures, processFrame, resetTrackingStats } from '../services/gazeTrackingService';
import './AttentionGame.css';

const TASK_DURATION = 60;
const COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#db2777'];
const TARGET_EMOJI = '🚀';

export default function AttentionGame() {
  const navigate = useNavigate();
  const {
    currentSessionId,
    cameraQualityStatus,
    setGameMetrics,
    setGazeFeatures,
    setLastResult,
  } = useAppContext();

  const videoRef = useRef(null);
  const stageRef = useRef(null);
  const animationRef = useRef(null);
  const timerRef = useRef(null);
  const trackingRef = useRef(null);

  const [timeLeft, setTimeLeft] = useState(TASK_DURATION);
  const [targetPos, setTargetPos] = useState({ x: 100, y: 100 });
  const [targetColor, setTargetColor] = useState(COLORS[0]);
  const [awaitingResponse, setAwaitingResponse] = useState(false);
  const [gameState, setGameState] = useState('countdown');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const metricsRef = useRef({
    reactionTimes: [],
    missedTargets: 0,
    wrongClicks: 0,
    targetChanges: 0,
    offTaskEvents: 0,
    changeTimestamp: 0,
  });
  const awaitingRef = useRef(false);

  const moveTarget = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const maxX = stage.clientWidth - 80;
    const maxY = stage.clientHeight - 80;
    setTargetPos({
      x: Math.random() * Math.max(maxX, 40),
      y: Math.random() * Math.max(maxY, 40),
    });
  }, []);

  const triggerColorChange = useCallback(() => {
    metricsRef.current.targetChanges += 1;
    setTargetColor((prev) => {
      let next = COLORS[Math.floor(Math.random() * COLORS.length)];
      while (next === prev) next = COLORS[Math.floor(Math.random() * COLORS.length)];
      return next;
    });
    setAwaitingResponse(true);
    awaitingRef.current = true;
    metricsRef.current.changeTimestamp = performance.now();
  }, []);

  const handleResponse = useCallback(() => {
    if (gameState !== 'playing') return;

    if (awaitingResponse) {
      const rt = performance.now() - (metricsRef.current.changeTimestamp || performance.now());
      metricsRef.current.reactionTimes.push(rt);
      setAwaitingResponse(false);
      awaitingRef.current = false;
    } else {
      metricsRef.current.wrongClicks += 1;
    }
  }, [awaitingResponse, gameState]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleResponse();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleResponse]);

  useEffect(() => {
    if (!currentSessionId) {
      navigate('/parent/screening');
      return;
    }

    resetTrackingStats();
    const stream = getActiveStream();
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }

    const countdown = setTimeout(() => setGameState('playing'), 3000);

    return () => clearTimeout(countdown);
  }, [currentSessionId, navigate]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    moveTarget();
    animationRef.current = window.setInterval(moveTarget, 1800);

    const colorInterval = window.setInterval(() => {
      if (Math.random() > 0.35) triggerColorChange();
    }, 2500);

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setGameState('finished');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const missInterval = window.setInterval(() => {
      if (awaitingRef.current) {
        metricsRef.current.missedTargets += 1;
        setAwaitingResponse(false);
        awaitingRef.current = false;
      }
    }, 3000);

    trackingRef.current = window.setInterval(async () => {
      if (videoRef.current) {
        const frame = await processFrame(videoRef.current);
        if (!frame.faceDetected && Math.random() > 0.7) {
          metricsRef.current.offTaskEvents += 1;
        }
      }
    }, 700);

    return () => {
      clearInterval(animationRef.current);
      clearInterval(colorInterval);
      clearInterval(timerRef.current);
      clearInterval(missInterval);
      clearInterval(trackingRef.current);
    };
  }, [gameState, moveTarget, triggerColorChange]);

  useEffect(() => {
    if (gameState !== 'finished' || submitting) return;

    const finish = async () => {
      setSubmitting(true);
      setError('');

      const metrics = metricsRef.current;
      const gaze = getTrackingFeatures();
      const avgReactionTime =
        metrics.reactionTimes.length > 0
          ? metrics.reactionTimes.reduce((a, b) => a + b, 0) / metrics.reactionTimes.length
          : 0;

      const gameMetrics = {
        avg_reaction_time: Number(avgReactionTime.toFixed(1)),
        missed_targets: metrics.missedTargets,
        wrong_clicks: metrics.wrongClicks,
        target_changes: metrics.targetChanges,
        total_duration_seconds: TASK_DURATION,
        reaction_times: metrics.reactionTimes,
      };

      setGameMetrics(gameMetrics);
      setGazeFeatures(gaze);

      try {
        const result = await submitResults(currentSessionId, {
          game_metrics: gameMetrics,
          gaze_features: {
            face_detected: gaze.faceDetected,
            gaze_stability_score: gaze.gazeStabilityScore,
            off_screen_gaze_count: gaze.offScreenGazeCount,
            blink_count: gaze.blinkCount,
            tracking_accuracy: gaze.trackingAccuracy,
            quality_score: gaze.qualityScore,
          },
          camera_quality_status: cameraQualityStatus,
        });
        setLastResult(result);
        navigate(`/parent/result/${currentSessionId}`);
      } catch (err) {
        setError(err.message);
        setSubmitting(false);
      }
    };

    finish();
  }, [
    gameState,
    submitting,
    currentSessionId,
    cameraQualityStatus,
    navigate,
    setGameMetrics,
    setGazeFeatures,
    setLastResult,
  ]);

  return (
    <div className="attention-game">
      <div className="game-header">
        <h1>Follow the Rocket!</h1>
        <strong>{timeLeft}s</strong>
      </div>

      <div className="game-stage" ref={stageRef}>
        {gameState === 'countdown' && (
          <div className="game-overlay">
            <div>
              <h2>Get ready!</h2>
              <p>Press spacebar when the rocket changes color.</p>
            </div>
          </div>
        )}
        {gameState === 'finished' && (
          <div className="game-overlay">
            <div>
              <h2>{submitting ? 'Saving results…' : 'Task complete!'}</h2>
              {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}
            </div>
          </div>
        )}
        {gameState === 'playing' && (
          <div
            className={`game-target ${awaitingResponse ? 'color-change' : ''}`}
            style={{
              left: targetPos.x,
              top: targetPos.y,
              backgroundColor: targetColor,
            }}
          >
            {TARGET_EMOJI}
          </div>
        )}
      </div>

      <div className="game-footer">
        <div className="game-stats">
          <span>Missed: {metricsRef.current.missedTargets}</span>
          <span>Wrong: {metricsRef.current.wrongClicks}</span>
          <span>Changes: {metricsRef.current.targetChanges}</span>
        </div>
        <button className="btn btn-primary" onClick={handleResponse} disabled={gameState !== 'playing'}>
          Press when color changes (Space)
        </button>
        <div className="game-pip">
          <video ref={videoRef} autoPlay playsInline muted />
        </div>
      </div>
    </div>
  );
}
