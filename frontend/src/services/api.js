const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let detail = 'Request failed';
    try {
      const data = await response.json();
      detail = data.detail || JSON.stringify(data);
    } catch {
      detail = response.statusText;
    }
    throw new Error(detail);
  }

  if (response.status === 204) return null;
  return response.json();
}

export function getApiStatus() {
  return request('/');
}

export function createSession(payload) {
  return request('/sessions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function listSessions() {
  return request('/sessions');
}

export function getSessionResult(sessionId) {
  return request(`/sessions/${sessionId}/result`);
}

export function getSession(sessionId) {
  return request(`/sessions/${sessionId}`);
}

export function submitResults(sessionId, payload) {
  return request(`/sessions/${sessionId}/results`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getClinicalReport(sessionId) {
  return request(`/sessions/${sessionId}/clinical-report`);
}

export function getSchoolSummary(sessionId) {
  return request(`/sessions/${sessionId}/school-summary`);
}

export function updateConsent(payload) {
  return request('/consent', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function markReportReviewed(sessionId, reviewedByRole = 'clinician') {
  return request(`/sessions/${sessionId}/review`, {
    method: 'POST',
    body: JSON.stringify({ reviewed_by_role: reviewedByRole }),
  });
}

export function getSessionActivity(sessionId) {
  return request(`/sessions/${sessionId}/activity`);
}
