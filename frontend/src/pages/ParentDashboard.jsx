import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ActivityFeed from '../components/ActivityFeed';
import ConsentToggle from '../components/ConsentToggle';
import { useAppContext } from '../context/AppContext';
import { listSessions, updateConsent, getSessionActivity } from '../services/api';
import { formatDate, reportStatusLabel, riskBadgeClass } from '../services/scoringFormatter';

export default function ParentDashboard() {
  const {
    consentSchoolSharing,
    setConsentSchoolSharing,
    childCode,
    setChildCode,
    currentSessionId,
    lastResult,
  } = useAppContext();
  const [sessions, setSessions] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listSessions();
      setSessions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [lastResult]);

  useEffect(() => {
    const latestId = currentSessionId || sessions[0]?.id;
    if (!latestId) return;
    getSessionActivity(latestId).then(setActivity).catch(() => setActivity([]));
  }, [sessions, currentSessionId, lastResult]);

  const handleConsentChange = async (value) => {
    setConsentSchoolSharing(value);
    const targetSessionId = currentSessionId || sessions[0]?.id;
    if (!targetSessionId) return;

    try {
      await updateConsent({
        session_id: targetSessionId,
        consent_school_sharing: value,
        role: 'parent',
      });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Parent Dashboard</h1>
        <p className="muted">
          Manage screening sessions, consent settings, and view attention-support summaries for{' '}
          <strong>{childCode}</strong>.
        </p>
      </div>

      <div className="grid-2">
        <div className="card stack">
          <h2>Start a new screening</h2>
          <label>
            Child / test ID (de-identified)
            <input
              type="text"
              value={childCode}
              onChange={(e) => setChildCode(e.target.value.toUpperCase())}
              placeholder="CHILD-001"
            />
          </label>
          <ConsentToggle checked={consentSchoolSharing} onChange={handleConsentChange} />
          <div className="actions">
            <Link to="/parent/screening" className="btn btn-primary">
              Start New Screening
            </Link>
          </div>
        </div>

        <div className="card">
          <h2>Latest result</h2>
          {lastResult ? (
            <div className="stack">
              <span className={riskBadgeClass(lastResult.risk_level)}>{lastResult.risk_level}</span>
              <p>Confidence: {lastResult.confidence_score}%</p>
              <p className="small muted">{lastResult.explanation}</p>
              <Link to={`/parent/result/${lastResult.session_id}`} className="btn btn-secondary">
                View Result Details
              </Link>
            </div>
          ) : (
            <p className="muted">Complete a screening to see results here.</p>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h2>Previous sessions</h2>
        {loading && <p className="muted">Loading sessions…</p>}
        {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}
        {!loading && sessions.length === 0 && <p className="muted">No sessions yet.</p>}
        {!loading && sessions.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Session</th>
                <th>Child ID</th>
                <th>Date</th>
                <th>Consent</th>
                <th>Report status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id}>
                  <td>#{session.id}</td>
                  <td>{session.child_code}</td>
                  <td>{formatDate(session.created_at)}</td>
                  <td>{session.consent_school_sharing ? 'Granted' : 'Not granted'}</td>
                  <td>{reportStatusLabel(session.report_status)}</td>
                  <td>
                    <Link to={`/parent/result/${session.id}`}>Open</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {currentSessionId && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h2>Activity feed</h2>
          <ActivityFeed events={activity} />
          <p className="small muted">Activity for the current session appears after events occur.</p>
        </div>
      )}
    </div>
  );
}
