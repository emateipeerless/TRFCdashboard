
// src/pages/PrototypePage.jsx
import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js pieces
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// 🔐 Lambda endpoint
const RANGE_API_URL =
  'https://lyle5fozf7.execute-api.us-east-1.amazonaws.com/ProtoDates';

// default deviceId stored in DynamoDB
const DEFAULT_DEVICE_ID = 'PROTO';

// Max hours per chunked request to Lambda.
// Keep this small enough that each individual query is safe.
const MAX_CHUNK_HOURS = 24; // you can bump to 48/72 if your Lambda is comfy

const PrototypePage = () => {
  const [points, setPoints] = useState([]); // { timestamp, rms }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // date-range UI state
  const [startDate, setStartDate] = useState(''); // datetime-local string
  const [endDate, setEndDate] = useState('');

  // Helper: split overall range into smaller [start,end] ISO windows
  const buildChunks = (startIso, endIso) => {
    const chunks = [];
    const start = new Date(startIso);
    const end = new Date(endIso);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return chunks;
    }
    if (start >= end) {
      return chunks;
    }

    let currentStart = new Date(start);
    const maxChunkMs = MAX_CHUNK_HOURS * 60 * 60 * 1000;

    while (currentStart < end) {
      let currentEnd = new Date(currentStart.getTime() + maxChunkMs);
      if (currentEnd > end) currentEnd = new Date(end);

      chunks.push({
        startIso: currentStart.toISOString(),
        endIso: currentEnd.toISOString(),
      });

      currentStart = new Date(currentEnd);
    }
    return chunks;
  };

  // ---------------- date-range fetching (Lambda POST, chunked) ----------------
  const loadRangeData = async () => {
    setError(null);
    if (!startDate || !endDate) {
      setError('Please select both start and end date/time.');
      return;
    }

    // convert from "YYYY-MM-DDTHH:mm" to ISO-8601 for Lambda
    const startIso = new Date(startDate).toISOString();
    const endIso = new Date(endDate).toISOString();

    if (startIso > endIso) {
      setError('Start date must be before end date.');
      return;
    }

    // Build smaller time windows so we never stress the Lambda with one huge query
    const chunks = buildChunks(startIso, endIso);
    if (chunks.length === 0) {
      setError('Invalid time range selection.');
      return;
    }

    setLoading(true);
    try {
      const allPointsMap = new Map(); // key: timestamp, value: rms (keep max if duplicate)

      for (const chunk of chunks) {
        const res = await fetch(RANGE_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            startDate: chunk.startIso,
            endDate: chunk.endIso,
            deviceId: DEFAULT_DEVICE_ID,
          }),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(
            `Range API error for chunk ${chunk.startIso} – ${chunk.endIso}: ${res.status} ${text}`
          );
        }

        const json = await res.json();
        const chunkItems = Array.isArray(json.items) ? json.items : [];

        for (const item of chunkItems) {
          const ts = item.timestamp;
          const rmsVal = Number(item.RMS ?? item.rms);
          if (!ts || Number.isNaN(rmsVal)) continue;

          // If we see the same timestamp from two chunks (boundary edge),
          // keep the higher RMS – preserves local spikes.
          const existing = allPointsMap.get(ts);
          if (existing == null || rmsVal > existing) {
            allPointsMap.set(ts, rmsVal);
          }
        }
      }

      // Convert map -> array
      let merged = Array.from(allPointsMap.entries()).map(([timestamp, rms]) => ({
        timestamp,
        rms,
      }));

      // sort oldest -> newest
      merged.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      setPoints(merged);
    } catch (e) {
      console.error('Error loading range data', e);
      setError(e.message || 'Failed to load range data');
      setPoints([]);
    } finally {
      setLoading(false);
    }
  };

  // Compute overall range (for label formatting)
  const rangeMs =
    points.length > 1
      ? new Date(points[points.length - 1].timestamp).getTime() -
        new Date(points[0].timestamp).getTime()
      : 0;

  const formatTime = (iso) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;

    // Very long range: date only
    if (rangeMs > 7 * 24 * 60 * 60 * 1000) {
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: '2-digit',
      });
    }

    // Medium range: date + hour
    if (rangeMs > 24 * 60 * 60 * 1000) {
      return d.toLocaleString(undefined, {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
      });
    }

    // Short range: full date + time
    return d.toLocaleString(undefined, {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ---------------- Chart.js data + options ----------------
  const labels = points.map((p) => formatTime(p.timestamp));
  const TARGET_LABEL_COUNT = 8;
  const labelStep =
    points.length > TARGET_LABEL_COUNT
      ? Math.ceil(points.length / TARGET_LABEL_COUNT)
      : 1;

  const chartData = {
    labels,
    datasets: [
      {
        label: 'RMS (m/s²)',
        data: points.map((p) => p.rms),
        borderColor: '#34d399',
        backgroundColor: 'rgba(52, 211, 153, 0.2)',
        tension: 0.2,
        pointRadius: 1.5,
        pointHoverRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        labels: {
          color: '#e5e7eb',
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const v = ctx.parsed.y;
            return `RMS: ${v.toFixed(3)} m/s²`;
          },
        },
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#e5e7eb',
          maxRotation: 0,
          minRotation: 0,
          autoSkip: false, // we handle skipping manually
          callback: function (value, index) {
            if (index % labelStep !== 0) {
              return '';
            }
            return labels[index] ?? '';
          },
        },
        grid: {
          color: 'rgba(75,85,99,0.3)',
        },
      },
      y: {
        ticks: {
          color: '#e5e7eb',
        },
        grid: {
          color: 'rgba(75,85,99,0.3)',
        },
        title: {
          display: true,
          text: 'RMS (m/s²)',
          color: '#e5e7eb',
        },
      },
    },
  };

  const subtitle =
    'Source: Lambda range query • Units: m/s² (RMS) • custom date range';

  return (
    <div className="flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <h1 className="text-2xl font-semibold text-white">
          Prototype Vibration Device
        </h1>
        <span className="text-sm text-gray-400">{subtitle}</span>
      </div>

      {/* Date range controls */}
      <div className="bg-gray-900/70 rounded-xl p-4 border border-gray-700/60 mb-4">
        <h2 className="text-lg font-medium text-white mb-3">
          Select Time Range
        </h2>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col">
            <label className="text-sm text-gray-300 mb-1">Start</label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-gray-800 text-gray-100 text-sm rounded-md px-3 py-2 border border-gray-600"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-300 mb-1">End</label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-gray-800 text-gray-100 text-sm rounded-md px-3 py-2 border border-gray-600"
            />
          </div>
          <button
            onClick={loadRangeData}
            disabled={loading}
            className="px-4 py-2 rounded-full bg-emerald-400 text-gray-900 font-semibold text-sm disabled:bg-gray-600"
          >
            {loading ? 'Loading…' : 'Load Range'}
          </button>
        </div>
        {points.length > 0 && (
          <p className="text-xs text-gray-400 mt-2">
            Showing {points.length} points from {formatTime(points[0].timestamp)}{' '}
            to {formatTime(points[points.length - 1].timestamp)}.
          </p>
        )}
      </div>

      {/* Status messages */}
      {loading && <div className="text-gray-300 text-sm">Loading data…</div>}
      {error && <div className="text-red-400 text-sm">Error: {error}</div>}
      {!loading && !error && points.length === 0 && (
        <div className="text-gray-500 text-sm">
          No data found in the selected range.
        </div>
      )}

      {/* Chart */}
      <div className="bg-gray-900/70 rounded-xl p-4 border border-gray-700/60 h-[400px]">
        <h2 className="text-lg font-medium text-white mb-3">
          RMS Vibration History (Custom Range)
        </h2>
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default PrototypePage;
