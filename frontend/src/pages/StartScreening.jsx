import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DisclaimerBox from '../components/DisclaimerBox';
import { useAppContext } from '../context/AppContext';
import { createSession } from '../services/api';

export default function StartScreening() {
  const navigate = useNavigate();
  const { childCode, consentSchoolSharing, setCurrentSessionId } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const startSession = async () => {
    setLoading(true);
    setError('');
    try {
      const session = await createSession({
        child_code: childCode,
        initiated_by_role: 'parent',
        consent_school_sharing: consentSchoolSharing,
      });
      setCurrentSessionId(session.id);
      navigate('/parent/camera-check');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stack">
      <div className="page-header">
        <h1>Start Screening</h1>
        <p className="muted">
          This short gamified attention task supports screening — it does not diagnose ADHD.
        </p>
      </div>

      <DisclaimerBox />

      <div className="card stack">
        <h2>Instructions for the child</h2>
        <ol>
          <li>Sit in a well-lit room with the camera facing you.</li>
          <li>Keep your face visible throughout the task.</li>
          <li>Follow the moving target on the screen.</li>
          <li>Press the button or spacebar when the target changes color.</li>
        </ol>
        <p className="muted small">Estimated duration: about 60 seconds.</p>
        {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}
        <div className="actions">
          <button className="btn btn-primary" onClick={startSession} disabled={loading}>
            {loading ? 'Creating session…' : 'Start Camera Check'}
          </button>
          <Link to="/parent" className="btn btn-ghost">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}