
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

  useEffect(() => {
    let cancelled = false;

    const load = async (isInitial = false) => {
      try {
        if (isInitial) {
          setLoading(true);
          setErr('');
        }
        if (abortRef.current) {
          abortRef.current.abort();
        }
        const ctrl = new AbortController();
        abortRef.current = ctrl;

        const resp = await latestbydevice(deviceId, { signal: ctrl.signal });
        if (cancelled) return;
        setData(resp);
        setErr('');
      } catch (e) {
        if (cancelled) return;
        console.error('Error loading latest snapshot', e);
        setErr(e.message || 'Failed to load latest snapshot');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load(true);
    timerRef.current = setInterval(() => load(false), REFRESH_MS);

    return () => {
      cancelled = true;
      if (abortRef.current) abortRef.current.abort();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [deviceId]);

  const running = Boolean(data?.running ?? data?.is_running);
  const lastSeen = data?.received_at || data?.ts || '—';

  return (
    <div className="page device-latest-page">
      {/* HEADER */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">
            Device{' '}
            <span className="page-title-id">
              {deviceId ?? (data && data.deviceId) ?? ''}
            </span>
          </h1>
          <p className="page-subtitle">
            Live pump health, environmental metrics, and vibration diagnostics.
          </p>
        </div>

        <div className="page-header-right">
          <Link className="link2 subtle" to={`/device/${deviceId}/info`}>
            Info &amp; Maintenance
          </Link>
          <Link className="link2 subtle" to="/sites">
            Back to Sites
          </Link>
        </div>
      </div>

      {loading && !data && <Loader text="Fetching latest snapshot…" />}
      {err && <div className="error2">Error: {err}</div>}

      {data && (
        <>
          {/* Summary row */}
          <div className="summary2">
            <StatusPill ok={running} text={running ? 'Running' : 'Stopped'} />
            <span className="muted">Device TS: {data.ts ?? '—'}</span>
            <span className="muted">Received: {lastSeen}</span>
          </div>

          {/* Core KPIs */}
          <section className="panel">
            <h2 className="panel-title">Core Operating Values</h2>
            <p className="panel-subtitle">
              Always-on gauges for pressure, casing temperature, and vibration.
            </p>

            <div className="g90-grid">
              <Gauge90
                label="Pressure"
                value={num(data.pressure_psi)}
                min={0}
                max={150}
                units="psi"
                goodMin={40}
                goodMax={110}
              />
              <Gauge90
                label="Temperature"
                value={num(data.temp_c)}
                min={0}
                max={70}
                units="°C"
                goodMin={5}
                goodMax={45}
              />
              <Gauge90
                label="Vibration"
                value={num(data.vibration_rms)}
                min={1500}
                max={4000}
                units="g RMS"
                goodMin={2000}
                goodMax={3000}
              />
            </div>
          </section>

          {/* Additional environmental KPIs */}
          <section className="panel">
            <h2 className="panel-title">Environmental Conditions</h2>
            <p className="panel-subtitle">
              Soil and water quality metrics near the pump.
            </p>

            <div className="g90-grid">
              <Gauge90
                label="Parts per Million"
                value={num(data.ppm)}
                min={0}
                max={2000}
                units="ppm"
                goodMin={200}
                goodMax={1200}
              />
              <Gauge90
                label="Soil Moisture"
                value={num(data.soil_moisture_pct)}
                min={0}
                max={100}
                units="%"
                goodMin={20}
                goodMax={60}
              />
              <Gauge90
                label="Soil pH"
                value={num(data.soil_ph)}
                min={0}
                max={14}
                units="pH"
                goodMin={5.5}
                goodMax={7.5}
              />
              <Gauge90
                label="Electrical Conductivity"
                value={num(data.soil_ec)}
                min={0}
                max={5}
                units="mS/cm"
                goodMin={1}
                goodMax={3}
              />
            </div>
          </section>

          {/* Static Vibration Diagnostics */}
          <section className="panel">
            <VibrationDiagnostics />
          </section>
        </>
      )}
    </div>
  );
}

/* ------------------------------
 * Static Vibration Diagnostics
 * ------------------------------ */
function VibrationDiagnostics() {
  const diag = {
    window: '7d',
    pump_starts: 12,
    pump_stops: 12,
    total_runtime_s: 15420,
    recent_runs: [
      { started_at: '10/29 08:12', duration_s: 420 },
      { started_at: '10/29 07:48', duration_s: 380 },
      { started_at: '10/29 06:15', duration_s: 1020 },
      { started_at: '10/28 18:22', duration_s: 600 },
      { started_at: '10/28 17:01', duration_s: 540 },
    ],
  };

  return (
    <>
      <div className="panel-header-row">
        <div>
          <h2 className="panel-title">Vibration Diagnostics</h2>
          <p className="panel-subtitle">
            Static example – last {diag.window} of pump cycles.
          </p>
        </div>
      </div>

      <div className="summary2" style={{ marginTop: '0.5rem' }}>
        <KPI label="Pump Starts" value={fmtInt(diag.pump_starts)} />
        <KPI label="Pump Stops" value={fmtInt(diag.pump_stops)} />
        <KPI label="Total Runtime" value={fmtDuration(diag.total_runtime_s)} />
      </div>

      <div className="row2" style={{ marginTop: '1rem' }}>
        <div className="grow">
          <h4 className="panel-subheading">Recent Run Durations</h4>
          <MiniBarChart
            items={diag.recent_runs
              .map((r) => ({
                label: r.started_at,
                value: r.duration_s,
              }))
              .reverse()}
            height={180}
            yLabel="seconds"
          />
        </div>
      </div>
    </>
  );
}

function KPI({ label, value }) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
    </div>
  );
}

/* Simple SVG bar chart – uses theme colors */
function MiniBarChart({ items, height, yLabel }) {
  if (!items?.length) return <div className="muted">No run data.</div>;

  const max = Math.max(...items.map((i) => i.value || 0)) || 1;
  const barWidth = 32;
  const gap = 12;
  const chartWidth = items.length * (barWidth + gap) + gap * 2;
  const chartHeight = height ?? 160;
  const paddingTop = 20;
  const paddingBottom = 30;

  return (
    <svg width="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
      {/* axis line */}
      <line
        x1={0}
        y1={chartHeight - paddingBottom}
        x2={chartWidth}
        y2={chartHeight - paddingBottom}
        stroke="var(--border)"
        strokeWidth="1"
      />
      {items.map((item, idx) => {
        const x = gap + idx * (barWidth + gap);
        const normalized = (item.value || 0) / max;
        const barH = normalized * (chartHeight - paddingTop - paddingBottom);
        const y = chartHeight - paddingBottom - barH;
        return (
          <g key={idx}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barH}
              rx={6}
              ry={6}
              fill="var(--accent)"
            />
            <text
              x={x + barWidth / 2}
              y={chartHeight - paddingBottom + 14}
              textAnchor="middle"
              fontSize="10"
              fill="var(--muted)"
            >
              {item.label}
            </text>
          </g>
        );
      })}
      {yLabel && (
        <text x={0} y={12} fontSize="10" fill="var(--muted)">
          {yLabel}
        </text>
      )}
    </svg>
  );
}

/* ------------------------------
 * Utility Functions
 * ------------------------------ */
function num(n) {
  return n === undefined || n === null || isNaN(n) ? null : Number(n);
}

function fmtInt(n) {
  return Number.isFinite(n) ? n.toString() : '—';
}

function fmtDuration(s) {
  if (!Number.isFinite(s)) return '—';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}
