import { useEffect, useRef, useState } from 'react';
import { listDevicesBySite } from '../api';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import StatusPill from '../components/StatusPill';

export default function Sites() {
  const [siteId, setSiteId] = useState('PumpHouse-1');
  const [items, setItems] = useState([]);
  const [nextKey, setNextKey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const abortRef = useRef();

  const search = async (reset = true) => {
    setLoading(true);
    setErr('');
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await listDevicesBySite(siteId.trim(), reset ? null : nextKey, 20, controller.signal);
      setItems(reset ? (res.items || []) : items.concat(res.items || []));
      setNextKey(res.nextKey || null);
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.error(e);
        setErr(e.response?.data?.error || e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // no auto-load; user clicks Search
  }, []);

  return (
    <div className="card2">
      <div className="row2">
        <h2>Sites</h2>
        <div className="grow" />
        <input
          value={siteId}
          onChange={e => setSiteId(e.target.value)}
          placeholder="site_id"
        />
        <button onClick={() => search(true)} disabled={loading}>Search</button>
      </div>

      {err && <div className="error2">Error: {err}</div>}
      {loading && items.length === 0 && <Loader />}

      {items.length === 0 && !loading ? (
        <EmptyState title="No devices found for this site">
          Try a different site_id or contact Support
        </EmptyState>
      ) : (
        <div className="list2">
          {items.map(it => (
            <a key={it.device_id} className="row-item" href={`/device/${encodeURIComponent(it.device_id)}`}>
              <div className="ri-title">
                <strong>{it.device_id}</strong>
                <span className="muted"> — {it.site_id ?? '-'}</span>
              </div>
              <div className="ri-sub">
                <span>Updated: {it.ts ?? '-'}</span>
              </div>
              <div className="ri-chips">
                <span className="chip2">PSI {fmt(it.pressure_psi)}</span>
                <span className="chip2">Temp {fmt(it.temp_c)}°C</span>
                <StatusPill ok={!!it.pump_running} text={it.pump_running ? 'Running' : 'Stopped'} />
              </div>
            </a>
          ))}
        </div>
      )}

      {nextKey && (
        <div className="center">
          <button onClick={() => search(false)} disabled={loading}>Load more</button>
        </div>
      )}
    </div>
  );
}

function fmt(n) {
  return (n === undefined || n === null) ? '-' : Number(n).toFixed(1);
}