/**
 * Gaze tracking service with MediaPipe-ready structure.
 * Falls back to simulated features when MediaPipe is unavailable.
 */

import { getCameraQualityHints } from './cameraService';

const USE_MEDIAPIPE = false; // Set true when @mediapipe/tasks-vision is integrated

let landmarker = null;
let frameCount = 0;
let offScreenGazeCount = 0;
let blinkCount = 0;
let stabilitySamples = [];
let trackingAccuracySamples = [];
let lastFaceDetected = false;

export async function initializeMediaPipe() {
  if (!USE_MEDIAPIPE) {
    return { ready: false, mode: 'placeholder' };
  }

  try {
    // Placeholder for future MediaPipe Face Landmarker integration:
    // const vision = await import('@mediapipe/tasks-vision');
    // landmarker = await vision.FaceLandmarker.createFromOptions(...);
    return { ready: true, mode: 'mediapipe' };
  } catch (error) {
    console.warn('MediaPipe unavailable, using placeholder tracking.', error);
    return { ready: false, mode: 'placeholder' };
  }
}

export async function processFrame(videoEl) {
  frameCount += 1;
  const quality = getCameraQualityHints(videoEl);

  if (USE_MEDIAPIPE && landmarker) {
    // Future: const result = landmarker.detectForVideo(videoEl, performance.now());
    // Extract iris/eye landmarks and compute gaze stability.
  }

  // Placeholder heuristic based on brightness variance and frame cadence.
  const simulatedStability = quality.lightingAcceptable ? 0.72 + Math.random() * 0.18 : 0.45 + Math.random() * 0.2;
  const simulatedAccuracy = quality.cameraReady ? 0.7 + Math.random() * 0.25 : 0.4 + Math.random() * 0.2;

  stabilitySamples.push(simulatedStability);
  trackingAccuracySamples.push(simulatedAccuracy);

  if (frameCount % 45 === 0 && Math.random() > 0.6) {
    offScreenGazeCount += 1;
  }
  if (frameCount % 90 === 0 && Math.random() > 0.5) {
    blinkCount += 1;
  }

  lastFaceDetected = quality.faceVisible && quality.lightingAcceptable;

  return {
    faceDetected: lastFaceDetected,
    gazeStabilityScore: simulatedStability,
    qualityScore: quality.lightingAcceptable ? 0.85 : 0.55,
  };
}

export function getTrackingFeatures() {
  const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

  return {
    faceDetected: lastFaceDetected,
    gazeStabilityScore: Number(avg(stabilitySamples).toFixed(3)),
    offScreenGazeCount,
    blinkCount,
    trackingAccuracy: Number(avg(trackingAccuracySamples).toFixed(3)),
    qualityScore: Number(avg(trackingAccuracySamples).toFixed(3)),
    frameCount,
    mode: USE_MEDIAPIPE && landmarker ? 'mediapipe' : 'placeholder',
  };
}

export function resetTrackingStats() {
  frameCount = 0;
  offScreenGazeCount = 0;
  blinkCount = 0;
  stabilitySamples = [];
  trackingAccuracySamples = [];
  lastFaceDetected = false;
}
