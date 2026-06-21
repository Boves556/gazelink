import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import ParentDashboard from './pages/ParentDashboard';
import StartScreening from './pages/StartScreening';
import CameraCheck from './pages/CameraCheck';
import AttentionGame from './pages/AttentionGame';
import ResultPage from './pages/ResultPage';
import ClinicianDashboard from './pages/ClinicianDashboard';
import SchoolDashboard from './pages/SchoolDashboard';
import ClinicalReport from './pages/ClinicalReport';
import SchoolSummary from './pages/SchoolSummary';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/parent" element={<ParentDashboard />} />
        <Route path="/parent/screening" element={<StartScreening />} />
        <Route path="/parent/camera-check" element={<CameraCheck />} />
        <Route path="/parent/game" element={<AttentionGame />} />
        <Route path="/parent/result/:sessionId" element={<ResultPage />} />
        <Route path="/clinician" element={<ClinicianDashboard />} />
        <Route path="/clinician/report/:sessionId" element={<ClinicalReport />} />
        <Route path="/school" element={<SchoolDashboard />} />
        <Route path="/school/summary/:sessionId" element={<SchoolSummary />} />
      </Routes>
    </Layout>
  );
}
