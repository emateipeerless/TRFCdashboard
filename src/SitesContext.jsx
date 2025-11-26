
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { getMySites } from './api';

const SitesContext = createContext(null);

export function SitesProvider({ children }) {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const abortRef = useRef();

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError('');

    getMySites(controller.signal)
      .then((data) => {
        setSites(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        if (e.name !== 'AbortError') {
          console.error(e);
          setError(e.message || 'Failed to load sites');
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  return (
    <SitesContext.Provider value={{ sites, loading, error }}>
      {children}
    </SitesContext.Provider>
  );
}

export function useSites() {
  const ctx = useContext(SitesContext);
  if (!ctx) {
    throw new Error('useSites must be used inside a SitesProvider');
  }
  return ctx;
}
