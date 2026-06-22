import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DisclaimerBox from '../components/DisclaimerBox';
import { getSchoolSummary } from '../services/api';
import { formatRiskLevel, riskBadgeClass } from '../services/scoringFormatter';

export default function SchoolSummary() {
  const { sessionId } = useParams();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await getSchoolSummary(sessionId);
        setSummary(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sessionId]);

  if (loading) return <p className="muted">Loading school summary…</p>;

  if (error) {
    return (
      <div className="card">
        <p>{error}</p>
        <Link to="/school">Back</Link>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="page-header">
        <h1>School Summary</h1>
        <p className="muted">De-identified educational summary for session #{sessionId}</p>
      </div>

      <DisclaimerBox />

      {!summary.consent_granted ? (
        <div className="card">
          <p>{summary.message}</p>
          <p className="small muted">
            A parent must enable &quot;Allow school summary sharing&quot; on the Parent Dashboard.
          </p>
        </div>
      ) : (
        <>
          <div className="card stack">
            <p>Child / test ID: <strong>{summary.child_code}</strong></p>
            <span className={riskBadgeClass(summary.attention_support_level)}>
              {summary.attention_support_level}
            </span>
            <h2>{formatRiskLevel(summary.attention_support_level)}</h2>
            <p className="muted">
              This summary describes classroom support needs only. It does not provide a medical diagnosis.
            </p>
          </div>

          <div className="card">
            <h3>Classroom support suggestions</h3>
            <ul>
              {summary.classroom_support_suggestions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </>
      )}

      <div className="actions">
        <Link to="/school" className="btn btn-ghost">
          Back to School Dashboard
        </Link>
      </div>

      <p className="small muted">{summary.disclaimer}</p>
    </div>
  );
}
