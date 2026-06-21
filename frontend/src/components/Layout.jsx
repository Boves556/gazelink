import { Link, useLocation } from 'react-router-dom';
import DisclaimerBox from './DisclaimerBox';
import { useAppContext } from '../context/AppContext';
import './Layout.css';

export default function Layout({ children }) {
  const location = useLocation();
  const { role } = useAppContext();
  const isGame = location.pathname.includes('/game');

  const navLink = (to, label) => (
    <Link to={to} className={location.pathname.startsWith(to) && to !== '/' ? 'active' : ''}>
      {label}
    </Link>
  );

  return (
    <div className="layout">
      {!isGame && (
        <header className="layout-header">
          <div className="layout-header-inner">
            <Link to="/" className="brand">
              <div className="brand-icon">G</div>
              <div className="brand-text">
                <strong>GazeLink</strong>
                <span>Screening support prototype</span>
              </div>
            </Link>
            <nav className="layout-nav">
              {navLink('/', 'Home')}
              {navLink('/parent', 'Parent')}
              {navLink('/clinician', 'Clinician')}
              {navLink('/school', 'School')}
              {role && <span className="small muted">Role: {role}</span>}
            </nav>
          </div>
        </header>
      )}
      <main className="layout-main">{children}</main>
      {!isGame && (
        <footer className="layout-footer">
          <DisclaimerBox compact />
        </footer>
      )}
    </div>
  );
}
