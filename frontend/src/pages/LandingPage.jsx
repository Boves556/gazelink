import { useNavigate } from 'react-router-dom';
import DisclaimerBox from '../components/DisclaimerBox';
import { useAppContext } from '../context/AppContext';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const { setRole } = useAppContext();

  const chooseRole = (role, path) => {
    setRole(role);
    navigate(path);
  };

  return (
    <div>
      <section className="landing-hero">
        <h1>GazeLink</h1>
        <p className="landing-subtitle">
          Gamified gaze and pupillometry screening support for ADHD — a university HCI/CSCW prototype
          for collaboration between parents, clinicians, and schools.
        </p>
        <DisclaimerBox />
      </section>

      <section className="role-cards">
        <div className="card role-card">
          <h3>Continue as Parent</h3>
          <p>Start a screening session, manage consent, and view child-friendly results.</p>
          <button className="btn btn-primary" onClick={() => chooseRole('parent', '/parent')}>
            Parent Dashboard
          </button>
        </div>
        <div className="card role-card">
          <h3>Continue as Clinician</h3>
          <p>Review detailed screening reports, acknowledge documentation, and track activity.</p>
          <button className="btn btn-primary" onClick={() => chooseRole('clinician', '/clinician')}>
            Clinician Dashboard
          </button>
        </div>
        <div className="card role-card">
          <h3>Continue as School</h3>
          <p>Access de-identified educational summaries only when parental consent is granted.</p>
          <button className="btn btn-primary" onClick={() => chooseRole('school', '/school')}>
            School Dashboard
          </button>
        </div>
      </section>
    </div>
  );
}
