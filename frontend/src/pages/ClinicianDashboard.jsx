import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ActivityFeed from '../components/ActivityFeed';
import DisclaimerBox from '../components/DisclaimerBox';
import { getSessionActivity, listSessions, markReportReviewed } from '../services/api';
import { formatDate, reportStatusLabel } from '../services/scoringFormatter';

export default function ClinicianDashboard() {
  const [sessions, setSessions] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await listSessions();
      setSessions(data.filter((s) => s.report_status !== 'pending'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const viewActivity = async (sessionId) => {
    const events = await getSessionActivity(sessionId);
    setSelectedActivity(events);
  };

  const handleReview = async (sessionId) => {
    try {
      const response = await markReportReviewed(sessionId);
      setMessage(response.message);
      loadSessions();
      viewActivity(sessionId);
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <div className="stack">
      <div className="page-header">
        <h1>Clinician Dashboard</h1>
        <p className="muted">Review screening sessions and acknowledge reports to avoid silent documentation.</p>
      </div>

      <DisclaimerBox />
      {message && <div className="card"><p>{message}</p></div>}

      <div className="card">
        <h2>Sessions</h2>
        {loading && <p className="muted">Loading…</p>}
        {!loading && sessions.length === 0 && (
          <p className="muted">No completed sessions yet. Complete a parent screening first.</p>
        )}
        {!loading && sessions.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Session</th>
                <th>Child ID</th>
                <th>Date</th>
                <th>Report status</th>
                <th>Camera</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id}>
                  <td>#{session.id}</td>
                  <td>{session.child_code}</td>
                  <td>{formatDate(session.created_at)}</td>
                  <td>{reportStatusLabel(session.report_status)}</td>
                  <td>{session.camera_quality_status}</td>
                  <td>
                    <div className="actions" style={{ marginTop: 0 }}>
                      <Link to={`/clinician/report/${session.id}`} className="btn btn-secondary">
                        Open Report
                      </Link>
                      <button className="btn btn-ghost" onClick={() => viewActivity(session.id)}>
                        Activity
                      </button>
                      {session.report_status !== 'reviewed' && (
                        <button className="btn btn-primary" onClick={() => handleReview(session.id)}>
                          Mark Reviewed
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedActivity.length > 0 && (
        <div className="card">
          <h2>Activity feed</h2>
          <ActivityFeed events={selectedActivity} />
        </div>
      )}
    </div>
  );
}
