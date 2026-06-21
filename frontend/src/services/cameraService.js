let mediaStream = null;
let videoElement = null;

export async function startCamera(videoEl, constraints = { video: true, audio: false }) {
  videoElement = videoEl;
  mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
  if (videoElement) {
    videoElement.srcObject = mediaStream;
    await videoElement.play();
  }
  return mediaStream;
}

export function stopCamera() {
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }
  if (videoElement) {
    videoElement.srcObject = null;
    videoElement = null;
  }
}

export function getActiveStream() {
  return mediaStream;
}

export function isCameraActive() {
  return Boolean(mediaStream && mediaStream.active);
}

export function getCameraQualityHints(videoEl) {
  if (!videoEl || videoEl.readyState < 2) {
    return {
      faceVisible: false,
      lightingAcceptable: false,
      cameraReady: false,
    };
  }

  const canvas = document.createElement('canvas');
  canvas.width = videoEl.videoWidth || 320;
  canvas.height = videoEl.videoHeight || 240;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

  let brightness = 0;
  for (let i = 0; i < data.length; i += 4) {
    brightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
  }
  brightness /= data.length / 4;

  const lightingAcceptable = brightness > 45 && brightness < 220;
  const cameraReady = videoEl.videoWidth > 0;

  return {
    faceVisible: cameraReady,
    lightingAcceptable,
    cameraReady,
    brightness,
  };
}
