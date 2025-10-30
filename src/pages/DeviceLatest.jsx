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
          <Link className="link2" to={`/device/${encodeURIComponent(deviceId)}/info`}>
            Info & Maintenance
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
          <div className="summary2">
            <StatusPill ok={running} text={running ? 'Running' : 'Stopped'} />
            <span className="muted">Device TS: {data.ts ?? '-'}</span>
            <span className="muted">Received: {lastSeen}</span>
          </div>

          {/* --- Main Gauges --- */}
          <div className="g90-grid">
            <Gauge90 label="Pressure" value={num(data.pressure_psi)} min={0} max={150} units="psi" goodMin={40} goodMax={110} />
            <Gauge90 label="Temperature" value={num(data.temp_c)} min={0} max={70} units="°C" goodMin={5} goodMax={45} />
            <Gauge90 label="Vibration" value={num(data.vibration_rms_g)} min={1500} max={4000} units="g RMS" goodMin={2000} goodMax={3000} />
          </div>

          {/* --- Additional Gauges --- */}
          <div className="g90-grid">
            <Gauge90 label="Parts per Million" value={num(data.ppm)} min={0} max={2000} units="ppm" goodMin={200} goodMax={1200} />
            <Gauge90 label="Soil Moisture" value={num(data.soil_moisture_pct)} min={0} max={100} units="%" goodMin={20} goodMax={60} />
            <Gauge90 label="Soil pH" value={num(data.soil_ph)} min={3} max={10} units="pH" goodMin={5.8} goodMax={7.2} />
          </div>
          <div className='lastone'>
            <Gauge90 label="Electrical Conductivity" value={num(data.ec_mScm)} min={0} max={10} units="mS/cm" goodMin={0.5} goodMax={3.0} />
          </div>

          {/* --- Static Example Diagnostics --- */}
          <div className='chartgrp'>
          <VibrationDiagnostics />
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------
 * Static Vibration Diagnostics (White Text + Full Width)
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
      { started_at: '10/28 21:50', duration_s: 265 },
      { started_at: '10/28 19:40', duration_s: 780 },
      { started_at: '10/28 17:10', duration_s: 640 },
      { started_at: '10/28 15:32', duration_s: 940 },
      { started_at: '10/28 13:01', duration_s: 300 },
    ],
  };

  return (
    <div
      className="card2"
      style={{
        marginTop: 16,
        backgroundColor: '#2e2e2e',
        color: 'white',
        padding: '1.5rem',
        borderRadius: '10px',
      }}
    >
      <div className="row2">
        <h3 style={{ color: 'white' }}>Vibration Diagnostics</h3>
        <div className="grow" />
        <span style={{ color: 'rgba(255,255,255,0.7)' }}>
          Window: {diag.window}
        </span>
      </div>

      <div className="summary2" style={{ marginTop: '0.5rem' }}>
        <KPI label="Pump Starts" value={fmtInt(diag.pump_starts)} />
        <KPI label="Pump Stops" value={fmtInt(diag.pump_stops)} />
        <KPI label="Total Runtime" value={fmtDuration(diag.total_runtime_s)} />
      </div>

      <div className="row2" style={{ marginTop: '1rem' }}>
        <div className="grow">
          <h4
            style={{
              marginBottom: 8,
              color: 'rgba(255,255,255,0.8)',
              fontWeight: '500',
            }}
          >
            Recent Run Durations
          </h4>
          <MiniBarChart
            items={diag.recent_runs.map((r) => ({
              label: r.started_at,
              value: r.duration_s,
            })).reverse()}
            height={180}
            yLabel="seconds"
          />
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value }) {
  return (
    <div className="detail" style={{ minWidth: 140 }}>
      <div
        className="detail-label"
        style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}
      >
        {label}
      </div>
      <div
        className="detail-value"
        style={{
          color: 'white',
          fontWeight: '600',
          fontSize: '1.2rem',
          marginTop: 2,
        }}
      >
        {value ?? '-'}
      </div>
    </div>
  );
}

/* ------------------------------
 * White Themed Inline Bar Chart
 * ------------------------------ */
function MiniBarChart({ items, height = 160, yLabel }) {
  const width = Math.max(600, items.length * 28 + 60);
  const pad = { top: 20, right: 10, bottom: 28, left: 40 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const values = items.map((i) => Number(i.value) || 0);
  const max = Math.max(...values, 1);
  const barW = (innerW / items.length) * 0.8;
  const gap = (innerW / items.length) * 0.2;

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={width} height={height}>
        <g transform={`translate(${pad.left}, ${pad.top})`}>
          {/* Y axis */}
          <line
            x1={0}
            y1={0}
            x2={0}
            y2={innerH}
            stroke="white"
            opacity="0.3"
          />
          {/* X axis */}
          <line
            x1={0}
            y1={innerH}
            x2={innerW}
            y2={innerH}
            stroke="white"
            opacity="0.3"
          />

          {/* Gridlines + tick labels */}
          {[0, 0.5, 1].map((t, idx) => {
            const y = innerH - t * innerH;
            const val = Math.round(t * max);
            return (
              <g key={idx}>
                <line
                  x1={0}
                  y1={y}
                  x2={innerW}
                  y2={y}
                  stroke="white"
                  opacity="0.1"
                />
                <text
                  x={-8}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="central"
                  fill="white"
                  opacity="0.7"
                  style={{ fontSize: 12 }}
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {items.map((it, i) => {
            const h = (Number(it.value) / max) * innerH;
            const x = i * (barW + gap) + gap / 2;
            const y = innerH - h;
            return (
              <g key={i} transform={`translate(${x}, ${y})`}>
                <rect
                  width={barW}
                  height={h}
                  rx={4}
                  ry={4}
                  fill="white"
                  opacity="0.3"
                />
                {/* value label */}
                <text
                  x={barW / 2}
                  y={-8}
                  textAnchor="middle"
                  fill="white"
                  opacity="0.8"
                  style={{ fontSize: 11 }}
                >
                  {Math.round(Number(it.value))}
                </text>
              </g>
            );
          })}

          {/* Y label */}
          {yLabel && (
            <text
              x={-40}
              y={150}
              fill="white"
              opacity="0.8"
              style={{ fontSize: 12 }}
            >
              {yLabel}
            </text>
          )}
        </g>
      </svg>
    </div>
  );
}

/* ------------------------------
 * Utility Functions
 * ------------------------------ */
function num(n) {
  return (n === undefined || n === null) ? null : Number(n);
}

function fmtInt(n) {
  if (n === null || n === undefined) return null;
  return Number(n).toLocaleString();
}

function fmtDuration(seconds) {
  if (seconds === null || seconds === undefined) return null;
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${sec}s`;
  return `${sec}s`;
}