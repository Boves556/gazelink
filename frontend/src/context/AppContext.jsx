import { createContext, useContext, useMemo, useState } from 'react';

const AppContext = createContext(null);

const STORAGE_KEY = 'gazelink_app_state';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function AppProvider({ children }) {
  const [role, setRole] = useState(() => loadState().role || null);
  const [currentSessionId, setCurrentSessionId] = useState(() => loadState().currentSessionId || null);
  const [consentSchoolSharing, setConsentSchoolSharing] = useState(
    () => loadState().consentSchoolSharing ?? false
  );
  const [childCode, setChildCode] = useState(() => loadState().childCode || 'CHILD-001');
  const [lastResult, setLastResult] = useState(() => loadState().lastResult || null);
  const [gameMetrics, setGameMetrics] = useState(null);
  const [gazeFeatures, setGazeFeatures] = useState(null);
  const [cameraQualityStatus, setCameraQualityStatus] = useState('unknown');

  const persist = (patch) => {
    const next = {
      role,
      currentSessionId,
      consentSchoolSharing,
      childCode,
      lastResult,
      ...patch,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const value = useMemo(
    () => ({
      role,
      setRole: (r) => {
        setRole(r);
        persist({ role: r });
      },
      currentSessionId,
      setCurrentSessionId: (id) => {
        setCurrentSessionId(id);
        persist({ currentSessionId: id });
      },
      consentSchoolSharing,
      setConsentSchoolSharing: (v) => {
        setConsentSchoolSharing(v);
        persist({ consentSchoolSharing: v });
      },
      childCode,
      setChildCode: (code) => {
        setChildCode(code);
        persist({ childCode: code });
      },
      lastResult,
      setLastResult: (result) => {
        setLastResult(result);
        persist({ lastResult: result });
      },
      gameMetrics,
      setGameMetrics,
      gazeFeatures,
      setGazeFeatures,
      cameraQualityStatus,
      setCameraQualityStatus,
    }),
    [role, currentSessionId, consentSchoolSharing, childCode, lastResult, gameMetrics, gazeFeatures, cameraQualityStatus]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
