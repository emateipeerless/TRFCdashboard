
import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { latestbydevice } from '../api';
import Gauge90 from '../components/Gauge90';
import Loader from '../components/Loader';
import StatusPill from '../components/StatusPill';

const REFRESH_MS = 10000;

export default function Device() {
  const { deviceId } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const abortRef = useRef();
  const timerRef = useRef();

  const load = async () => {
    setLoading(true);
    setErr('');
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const item = await latestbydevice(deviceId, controller.signal);
      setData(item);
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.error(e);
        setErr(e.message || 'Error');
        setData(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    timerRef.current = setInterval(load, REFRESH_MS);
    return () => {
      abortRef.current?.abort();
      clearInterval(timerRef.current);
    };
  }, [deviceId]);

  const running = !!data?.pump_running;
  const lastSeen = data?.received_at || '-';
  return (
    <div className="card2">
      <div className="row2">
        <h2>Device {deviceId}</h2>
        
    <div className="grow" />
        <div className="actions">
        <Link className="link2" to={`/device/${encodeURIComponent(deviceId)}/info`}>Info & Maintenance</Link>
        <Link className="link2 subtle" to="/sites">Back to Sites</Link>
    </div>
    </div>

      {loading && !data && <Loader text="Fetching latest snapshot…" />}
      {err && <div className="error2">Error: {err}</div>}

      {data && (
        <>
          <div className="summary2">
            <StatusPill ok={running} text={running ? 'Running' : 'Stopped'} />
            <span className="muted">Device TS: {data.ts ?? '-'}</span>
            <span className="muted">Received: {lastSeen}</span>
          </div>

          <div className="g90-grid">
            <Gauge90 label="Pressure" value={num(data.pressure_psi)} min={0} max={150} units="psi" goodMin={40} goodMax={110} />
            <Gauge90 label="Temperature" value={num(data.temp_c)} min={0} max={70} units="°C" goodMin={5} goodMax={45} />
            <Gauge90 label="Vibration" value={num(data.vibration_rms_g)} min={0} max={1.5} units="g RMS" goodMin={0} goodMax={0.3} />
          </div>
        </>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="detail">
      <div className="detail-label">{label}</div>
      <div className="detail-value">{value ?? '-'}</div>
    </div>
  );
}

function num(n) {
  return (n === undefined || n === null) ? null : Number(n);
}
