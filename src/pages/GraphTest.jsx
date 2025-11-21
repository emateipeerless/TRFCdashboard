import React, { useEffect, useState } from 'react';
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
import { getProtoData } from '../api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const TestingGraph = () => {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // New state for date range
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  const loadData = async (isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true);
        setError(null);
      }

      // Pass startDate and endDate to API
      const raw = await getProtoData({ start: startDate, end: endDate });

      let cleaned = Array.isArray(raw)
        ? raw
            .map((item) => ({
              timestamp: item.timestamp,
              rms: Number(item.rms),
            }))
            .filter((p) => !!p.timestamp && !Number.isNaN(p.rms))
        : [];

      cleaned.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      setPoints(cleaned);
    } catch (e) {
      console.error('Error loading proto data', e);
      setError(e.message || 'Failed to load proto data');
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
  }, [startDate, endDate]); // reload when dates change

  const formatTime = (iso) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { labels: { color: '#e5e7eb' } },
      tooltip: {
        callbacks: {
          label: (ctx) => `RMS: ${ctx.parsed.y.toFixed(3)} m/s²`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#e5e7eb', maxRotation: 45, minRotation: 45 },
        grid: { color: 'rgba(75,85,99,0.3)' },
      },
      y: {
        ticks: { color: '#e5e7eb' },
        grid: { color: 'rgba(75,85,99,0.3)' },
        title: { display: true, text: 'RMS (m/s²)', color: '#e5e7eb' },
      },
    },
  };

  return (
    <div className="flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Prototype Vibration Device</h1>
        <span className="text-sm text-gray-400">
          Source: /protodata • Units: m/s² (RMS) • showing {startDate} → {endDate}
        </span>
      </div>

      {/* Date Range Picker */}
      <div className="flex gap-4 my-4">
        <div>
          <label className="text-gray-300 text-sm">Start Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="ml-2 p-1 rounded bg-gray-800 text-white"
          />
        </div>
        <div>
          <label className="text-gray-300 text-sm">End Date:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="ml-2 p-1 rounded bg-gray-800 text-white"
          />
        </div>
      </div>

      {loading && <div className="text-gray-300 text-sm">Loading data…</div>}
      {error && <div className="text-red-400 text-sm">Error: {error}</div>}
      {!loading && !error && points.length === 0 && (
        <div className="text-gray-500 text-sm">No vibration data found for selected range.</div>
      )}

      <div className="bg-gray-900/70 rounded-xl p-4 border border-gray-700/60 h-[400px]">
        <h2 className="text-lg font-medium text-white mb-3">
          RMS Vibration History ({startDate} → {endDate})
        </h2>
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default TestingGraph;