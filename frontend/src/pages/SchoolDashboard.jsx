import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DisclaimerBox from '../components/DisclaimerBox';
import { listSessions } from '../services/api';
import { formatDate, reportStatusLabel } from '../services/scoringFormatter';

export default function SchoolDashboard() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await listSessions();
        setSessions(data.filter((s) => s.report_status !== 'pending'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="stack">
      <div className="page-header">
        <h1>School Dashboard</h1>
        <p className="muted">
          Privacy-limited educational summaries only. No diagnostic labels or raw medical metrics are shown.
        </p>
      </div>

      <DisclaimerBox />

      <div className="card">
        <h2>Available summaries</h2>
        {loading && <p className="muted">Loading…</p>}
        {!loading && sessions.length === 0 && (
          <p className="muted">No sessions available yet.</p>
        )}
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
                    <Link to={`/school/summary/${session.id}`}>View Summary</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
