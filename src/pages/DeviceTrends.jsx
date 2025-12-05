
// src/pages/DeviceTrends.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LineChart } from '@mui/x-charts/LineChart';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import { latestbydevice } from '../api';
import Gauge90 from '../components/Gauge90';
import Loader from '../components/Loader';
import StatusPill from '../components/StatusPill';

// ------------------------------
// Metric configuration
// ------------------------------
const METRICS = [
  {
    key: 'pressure',
    label: 'Pressure',
    fieldKeys: ['pressure_psi', 'pressure'],
    min: 0,
    max: 150,
    units: 'psi',
    goodMin: 40,
    goodMax: 110,
  },
  {
    key: 'temperature',
    label: 'Temperature',
    fieldKeys: ['temp_c', 'temperature_c', 'temperature'],
    min: 0,
    max: 70,
    units: '°C',
    goodMin: 5,
    goodMax: 45,
  },
  {
    key: 'vibration',
    label: 'Vibration',
    fieldKeys: ['vibration_rms', 'vibration'],
    min: 1500,
    max: 4000,
    units: 'g RMS',
    goodMin: 2000,
    goodMax: 3000,
  },
  {
    key: 'ppm',
    label: 'Parts per Million',
    fieldKeys: ['ppm', 'parts_per_million'],
    min: 0,
    max: 2000,
    units: 'ppm',
    goodMin: 200,
    goodMax: 1200,
  },
  {
    key: 'moisture',
    label: 'Soil Moisture',
    fieldKeys: ['soil_moisture_pct', 'soil_moisture'],
    min: 0,
    max: 100,
    units: '%',
    goodMin: 20,
    goodMax: 60,
  },
  {
    key: 'ph',
    label: 'Soil pH',
    fieldKeys: ['soil_ph', 'ph'],
    min: 3,
    max: 10,
    units: 'pH',
    goodMin: 5.8,
    goodMax: 7.5,
  },
  {
    key: 'ec',
    label: 'Electrical Conductivity',
    fieldKeys: ['soil_ec', 'ec'],
    min: 0,
    max: 5,
    units: 'mS/cm',
    goodMin: 1,
    goodMax: 3,
  },
];

// Initial visibility: core metrics on, others off
const DEFAULT_VISIBLE = {
  pressure: true,
  temperature: true,
  vibration: true,
  ppm: false,
  moisture: false,
  ph: false,
  ec: false,
};

export default function DeviceTrends() {
  const { deviceId } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [metricVisibility, setMetricVisibility] = useState(DEFAULT_VISIBLE);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!deviceId) return;
      try {
        setErr('');
        setLoading(true);
        const result = await latestbydevice(deviceId);
        if (!cancelled) {
          setData(result);
        }
      } catch (e) {
        console.error('Failed to load device latest', e);
        if (!cancelled) setErr('Failed to load device data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [deviceId]);

  const running = isRunning(data);
  const deviceTs = data?.ts ?? data?.timestamp ?? null;
  const lastSeen = timeAgo(data?.ingested_at ?? data?.ts ?? null);

  const handleToggle = (key) => {
    setMetricVisibility((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const visibleMetrics = METRICS.filter((metric) => !!metricVisibility[metric.key]);

  return (
    <div className="page device-trends-page">
      {/* HEADER */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">
            Device{' '}
            <span className="page-title-id">
              {deviceId ?? (data && data.deviceId) ?? ''}
            </span>{' '}
            Trends
          </h1>
        </div>
      </div>

      {loading && !data && <Loader text="Loading latest device snapshot…" />}
      {err && <div className="error2">Error: {err}</div>}

      {data && (
        <>
          {/* Summary row */}
          <div className="summary2">
            <StatusPill ok={running} text={running ? 'Running' : 'Stopped'} />
            <span className="muted">Device TS: {deviceTs ?? '—'}</span>
            <span className="muted">Last seen: {lastSeen}</span>
          </div>

          {/* Metric toggles */}
          <section className="panel">
            <div className="panel-header-row">
              <div>
                <h2 className="panel-title">Displayed Metrics</h2>
                <p className="panel-subtitle">
                  Toggle which metrics to show below. Gauges use the latest value; lines show a demo history.
                </p>
              </div>
            </div>
            <div className="trend-toggles">
              {METRICS.map((metric) => (
                <FormControlLabel
                  key={metric.key}
                  control={
                    <Switch
                      size="small"
                      checked={!!metricVisibility[metric.key]}
                      onChange={() => handleToggle(metric.key)}
                    />
                  }
                  label={metric.label}
                />
              ))}
            </div>
          </section>

          {/* Trend rows */}
          <div className="trend-rows">
            {visibleMetrics.length === 0 && (
              <div className="empty-text muted">
                No metrics selected. Use the toggles above to choose which trends to display.
              </div>
            )}
            {visibleMetrics.map((metric) => (
              <MetricTrendRow key={metric.key} metric={metric} data={data} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------
 * Row: Gauge on left + MUI X LineChart on right
 * ------------------------------ */
function MetricTrendRow({ metric, data }) {
  const value = getMetricValue(data, metric);
  const { xLabels, yValues } = useMemo(() => buildDemoSeries(metric, value), [metric.key, value]);

  return (
    <section className="panel trend-row">
      <div className="trend-row-grid">
        {/* Left: gauge */}
        <div className="trend-gauge">
          <Gauge90
            label={metric.label}
            value={value}
            min={metric.min}
            max={metric.max}
            units={metric.units}
            goodMin={metric.goodMin}
            goodMax={metric.goodMax}
          />
          <div className="trend-gauge-footer">
            <span className="muted">
              Range: {metric.min}–{metric.max} {metric.units}
            </span>
          </div>
        </div>

        {/* Right: line chart */}
        <div className="trend-chart">
          <div className="trend-chart-header">
            <h3 className="panel-subheading">{metric.label} trend</h3>
            <span className="muted">Demo data over last 12 hours</span>
          </div>
          <div className="trend-chart-body">
            <LineChart
              xAxis={[
                {
                  scaleType: 'point',
                  data: xLabels,
                  tickLabelStyle: { fontSize: 10, fill: 'var(--muted)' },
                },
              ]}
              series={[
                {
                  id: metric.key,
                  label: `${metric.label} (${metric.units})`,
                  data: yValues,
                  showMark: false,
                  curve: 'linear',
                  color: 'var(--accent)',
                },
              ]}
              slotProps={{
                legend: { labelStyle: { fill: 'var(--muted)', fontSize: 11 } },
                grid: { sx: { '& line': { stroke: 'var(--border)' } } },
              }}
              height={220}
              margin={{ left: 60, right: 20, top: 20, bottom: 40 }}
              sx={{
                backgroundColor: 'var(--panel)',
                '--Charts-gridLineColor': 'var(--border)',
                '--Charts-axisLineColor': 'var(--border)',
                '--Charts-tooltipBackground': 'var(--panel-elevated)',
                '--Charts-tooltipTextColor': 'var(--text)',
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------
 * Helpers
 * ------------------------------ */
function getMetricValue(data, metric) {
  if (!data) return null;
  for (const key of metric.fieldKeys) {
    const raw = data[key];
    if (raw === undefined || raw === null) continue;
    const n = Number(raw);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

function isRunning(data) {
  if (!data) return false;
  if (typeof data.running === 'boolean') return data.running;
  if (typeof data.is_running === 'boolean') return data.is_running;
  if (typeof data.status === 'string') {
    return data.status.toLowerCase() === 'running';
  }
  return false;
}

/**
 * Builds demo series centered around latest value.
 * Real backend history can drop in here later.
 */
function buildDemoSeries(metric, latestValue) {
  const now = new Date();
  const points = 24; // every ~30 min over 12h
  const xLabels = [];
  const yValues = [];

  const base = Number.isFinite(latestValue)
    ? latestValue
    : (metric.min + metric.max) / 2;

  const span = (metric.max - metric.min) || 1;
  const wiggle = span * 0.05; // ±5% band

  for (let i = points - 1; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 30 * 60 * 1000);
    const label = t.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
    xLabels.push(label);

    // deterministic-ish "noise" so it doesn't jump every render
    const phase = i / points;
    const sin = Math.sin(phase * Math.PI * 2);
    const offset = sin * wiggle * 0.6;
    const jitter = ((hash(metric.key + String(i)) % 100) / 100 - 0.5) * wiggle * 0.4;

    let v = base + offset + jitter;

    // clamp to range with small margin inside bounds
    if (v < metric.min) v = metric.min + (metric.max - metric.min) * 0.05;
    if (v > metric.max) v = metric.max - (metric.max - metric.min) * 0.05;

    yValues.push(Number(v.toFixed(2)));
  }

  return { xLabels, yValues };
}

// tiny hash for deterministic jitter
function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function timeAgo(ts) {
  if (!ts) return '—';
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return '—';

  const now = new Date();
  const diffMs = now - date;
  if (diffMs < 0) return 'just now';

  const sec = Math.floor(diffMs / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);

  if (day > 0) return `${day}d ${hr % 24}h ago`;
  if (hr > 0) return `${hr}h ${min % 60}m ago`;
  if (min > 0) return `${min}m ago`;
  return `${sec}s ago`;
}
