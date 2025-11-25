
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

// 🔐 TODO: put your real API Gateway URL here:
const RANGE_API_URL =
  'https://lyle5fozf7.execute-api.us-east-1.amazonaws.com/ProtoDates';

// default deviceId stored in DynamoDB (from your screenshot)
const DEFAULT_DEVICE_ID = 'PROTO';

const PrototypePage = () => {
  const [points, setPoints] = useState([]); // { timestamp, rms }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // date-range UI state
  const [startDate, setStartDate] = useState(''); // datetime-local string
  const [endDate, setEndDate] = useState('');

  // ---------------- date-range fetching (Lambda POST) ----------------
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

    setLoading(true);
    try {
      const res = await fetch(RANGE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: startIso,
          endDate: endIso,
          deviceId: DEFAULT_DEVICE_ID,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Range API error: ${res.status} ${text}`);
      }

      const json = await res.json();
      // Lambda returns: { items: [ { deviceId, timestamp, RMS } ] }
      let cleaned = Array.isArray(json.items)
        ? json.items
            .map((item) => ({
              timestamp: item.timestamp,
              // handle RMS or rms just in case
              rms: Number(item.RMS ?? item.rms),
            }))
            .filter((p) => !!p.timestamp && !Number.isNaN(p.rms))
        : [];

      // sort oldest -> newest
      cleaned.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      setPoints(cleaned);
    } catch (e) {
      console.error('Error loading range data', e);
      setError(e.message || 'Failed to load range data');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    // show date+time since we’re looking at a range
    return d.toLocaleString(undefined, {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ---------------- Chart.js data + options ----------------
  const chartData = {
    labels: points.map((p) => formatTime(p.timestamp)),
    datasets: [
      {
        label: 'RMS (m/s²)',
        data: points.map((p) => p.rms),
        borderColor: '#34d399',
        backgroundColor: 'rgba(52, 211, 153, 0.2)',
        tension: 0.2,
        pointRadius: 2,
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
          maxRotation: 45,
          minRotation: 45,
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
        <h1 className="text-2xl font-semibold text-white">Prototype Vibration Device</h1>
        <span className="text-sm text-gray-400">{subtitle}</span>
      </div>

      {/* Date range controls */}
      <div className="bg-gray-900/70 rounded-xl p-4 border border-gray-700/60 mb-4">
        <h2 className="text-lg font-medium text-white mb-3">Select Time Range</h2>
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
            Showing {points.length} points from {formatTime(points[0].timestamp)} to{' '}
            {formatTime(points[points.length - 1].timestamp)}.
          </p>
        )}
      </div>

      {/* Status messages */}
      {loading && (
        <div className="text-gray-300 text-sm">Loading data…</div>
      )}
      {error && (
        <div className="text-red-400 text-sm">Error: {error}</div>
      )}
      {!loading && !error && points.length === 0 && (
        <div className="text-gray-500 text-sm">No data found in the selected range.</div>
      )}

      {/* Chart */}
      <div className="bg-gray-900/70 rounded-xl p-4 border border-gray-700/60 h-[400px]">
        <h2 className="text-lg font-medium text-white mb-3">RMS Vibration History (Custom Range)</h2>
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default PrototypePage;
