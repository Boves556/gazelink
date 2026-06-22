import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ActivityFeed from '../components/ActivityFeed';
import DisclaimerBox from '../components/DisclaimerBox';
import { getClinicalReport, getSessionActivity, markReportReviewed } from '../services/api';
import {
  formatDate,
  formatMs,
  formatPercent,
  formatRiskLevel,
  reportStatusLabel,
  riskBadgeClass,
} from '../services/scoringFormatter';

export default function ClinicalReport() {
  const { sessionId } = useParams();
  const [report, setReport] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [reportData, events] = await Promise.all([
          getClinicalReport(sessionId),
          getSessionActivity(sessionId),
        ]);
        setReport(reportData);
        setActivity(events);
      } catch (err) {
        setMessage(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sessionId]);

  const handleReview = async () => {
    try {
      const response = await markReportReviewed(sessionId);
      setMessage(response.message);
      const updated = await getClinicalReport(sessionId);
      setReport(updated);
      const events = await getSessionActivity(sessionId);
      setActivity(events);
    } catch (err) {
      setMessage(err.message);
    }
  };

  if (loading) return <p className="muted">Loading clinical report…</p>;
  if (!report) {
    return (
      <div className="card">
        <p>{message || 'Report unavailable.'}</p>
        <Link to="/clinician">Back</Link>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="page-header">
        <h1>Clinical Report</h1>
        <p className="muted">Session #{report.session_id} · {report.child_code}</p>
      </div>

      <DisclaimerBox />
      {message && <div className="card"><p>{message}</p></div>}

      <div className="grid-2">
        <div className="card stack">
          <span className={riskBadgeClass(report.attention_support_level)}>
            {report.attention_support_level}
          </span>
          <h2>{formatRiskLevel(report.attention_support_level)}</h2>
          <p>Session date: {formatDate(report.session_date)}</p>
          <p>Confidence score: {report.confidence_score}%</p>
          <p>Report status: {reportStatusLabel(report.report_status)}</p>
          {report.reviewed_at && <p>Reviewed: {formatDate(report.reviewed_at)}</p>}
        </div>

        <div className="card stack">
          <h3>Metrics</h3>
          <p>Average reaction time: {formatMs(report.avg_reaction_time)}</p>
          <p>Missed targets: {report.missed_targets}</p>
          <p>Wrong clicks: {report.wrong_clicks}</p>
          <p>Target changes: {report.target_changes}</p>
          <p>Gaze stability score: {formatPercent(report.gaze_stability_score)}</p>
          <p>Off-screen gaze count: {report.off_screen_gaze_count}</p>
          <p>Blink count: {report.blink_count}</p>
          <p>Tracking accuracy: {formatPercent(report.tracking_accuracy)}</p>
        </div>
      </div>

      <div className="card stack">
        <h3>Recommendation</h3>
        <p><strong>{report.recommendation}</strong></p>
        <p>{report.explanation}</p>
        <ul>
          {report.suggested_actions.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ul>
      </div>

      <div className="actions">
        {report.report_status !== 'reviewed' && (
          <button className="btn btn-primary" onClick={handleReview}>
            Mark Report as Reviewed
          </button>
        )}
        <Link to="/clinician" className="btn btn-ghost">
          Back to Dashboard
        </Link>
      </div>

      <div className="card">
        <h2>Activity feed</h2>
        <ActivityFeed events={activity} />
      </div>

      <p className="small muted">{report.disclaimer}</p>
    </div>
  );
}
