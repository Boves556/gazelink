import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DisclaimerBox from "../components/DisclaimerBox";
import { useAppContext } from "../context/AppContext";
import { getSession, getSessionResult } from "../services/api";
import {
  formatDate,
  formatMs,
  formatPercent,
  formatRiskLevel,
  reportStatusLabel,
  riskBadgeClass,
} from "../services/scoringFormatter";

export default function ResultPage() {
  const { sessionId } = useParams();
  const { lastResult, gameMetrics, gazeFeatures } = useAppContext();
  const [session, setSession] = useState(null);
  const [result, setResult] = useState(lastResult);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const sessionData = await getSession(sessionId);
        setSession(sessionData);
        if (lastResult && String(lastResult.session_id) === String(sessionId)) {
          setResult(lastResult);
        } else {
          try {
            const resultData = await getSessionResult(sessionId);
            setResult(resultData);
          } catch {
            setResult(null);
          }
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sessionId, lastResult]);

  if (loading) return <p className="muted">Loading result…</p>;
  if (!result) {
    return (
      <div className="card">
        <p>No results found for this session.</p>
        <Link to="/parent">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="page-header">
        <h1>Screening Result</h1>
        <p className="muted">
          Session #{sessionId} · {session?.child_code}
        </p>
      </div>

      <DisclaimerBox />

      <div className="grid-2">
        <div className="card stack">
          <span className={riskBadgeClass(result.risk_level)}>
            {result.risk_level}
          </span>
          <h2>{formatRiskLevel(result.risk_level)}</h2>
          <p>
            Confidence: <strong>{result.confidence_score}%</strong>
          </p>
          <p>{result.explanation}</p>
        </div>

        <div className="card stack">
          <h3>Task summary</h3>
          <p>Average reaction time: {formatMs(result.avg_reaction_time)}</p>
          <p>Missed targets: {result.missed_targets}</p>
          <p>Wrong clicks: {result.wrong_clicks}</p>
          <p>Tracking accuracy: {formatPercent(result.tracking_accuracy)}</p>
          {gameMetrics && (
            <p className="small muted">
              Target changes during task: {gameMetrics.target_changes}
            </p>
          )}
          {gazeFeatures && (
            <p className="small muted">
              Gaze tracking mode: {gazeFeatures.mode}
            </p>
          )}
        </div>
      </div>

      {session && (
        <div className="card stack">
          <h3>Session metadata</h3>
          <p>Session ID: #{session.id}</p>
          <p>Timestamp: {formatDate(session.created_at)}</p>
          <p>Initiated by role: {session.initiated_by_role}</p>
          <p>Camera quality status: {session.camera_quality_status}</p>
          <p>
            School sharing consent:{" "}
            {session.consent_school_sharing ? "Granted" : "Not granted"}
          </p>
          <p>Report status: {reportStatusLabel(session.report_status)}</p>
        </div>
      )}

      {result.suggested_actions?.length > 0 && (
        <div className="card">
          <h3>Suggested next steps</h3>
          <ul>
            {result.suggested_actions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="actions">
        <Link
          to={`/clinician/report/${sessionId}`}
          className="btn btn-secondary"
        >
          View Clinical Report
        </Link>
        <Link to={`/school/summary/${sessionId}`} className="btn btn-secondary">
          View School Summary
        </Link>
        <Link to="/parent" className="btn btn-ghost">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
