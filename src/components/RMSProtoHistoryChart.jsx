import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Brush,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import { getProtoData } from '../api';

export default function RMSProtoHistoryChart() {
  const [data, setData] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [error, setError] = useState(null);

  const safeFormatTimestamp = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return ts;
    try {
      return format(d, 'MM-dd HH:mm:ss');
    } catch {
      return ts;
    }
  };

  const normalizeData = (raw) => {
    if (!Array.isArray(raw)) return [];
    return raw
      .map((item) => ({
        timestamp: item.timestamp,
        device: item.device,
        rms: Number(item.rms),
      }))
      .filter((p) => !!p.timestamp && !Number.isNaN(p.rms))
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
  };

  const loadData = async (isInitial = false) => {
    try {
      if (isInitial) {
        setLoadingInitial(true);
        setError(null);
      }
      const result = await getProtoData(); // <-- /protodata
      const norm = normalizeData(result);
      setData(norm);
    } catch (err) {
      console.error('Error loading proto RMS data:', err);
      setError(err.message || 'Failed to load RMS data');
    } finally {
      if (isInitial) setLoadingInitial(false);
    }
  };

  useEffect(() => {
    // initial load
    loadData(true);

    // poll every minute
    const id = setInterval(() => loadData(false), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">
          Proto Vibration RMS History
        </h2>
        <span className="text-sm text-gray-400">
          Units: m/s² (RMS) • updates every minute
        </span>
      </div>

      {loadingInitial && (
        <div className="text-gray-300 text-sm">Loading RMS data…</div>
      )}

      {error && (
        <div className="text-red-400 text-sm">Error: {error}</div>
      )}

      {!loadingInitial && !error && data.length === 0 && (
        <div className="text-gray-500 text-sm">No data available yet.</div>
      )}

      {data.length > 0 && (
        <div className="bg-gray-900/70 rounded-xl p-4 border border-gray-700/60">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={data}
              margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
            >
              <CartesianGrid stroke="rgba(156,163,175,0.25)" vertical={false} />

              <XAxis
                dataKey="timestamp"
                stroke="#9ca3af"
                tick={{ fill: '#e5e7eb', fontSize: 12 }}
                tickFormatter={safeFormatTimestamp}
                minTickGap={20}
              />

              <YAxis
                stroke="#9ca3af"
                tick={{ fill: '#e5e7eb', fontSize: 12 }}
                label={{
                  value: 'RMS (m/s²)',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#e5e7eb',
                  fontSize: 12,
                }}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: '#111827',
                  border: '1px solid #4b5563',
                  borderRadius: 8,
                  color: '#e5e7eb',
                }}
                labelFormatter={(label) => `Time: ${safeFormatTimestamp(label)}`}
                formatter={(value) => {
                  const num = Number(value);
                  if (Number.isNaN(num)) return [String(value ?? ''), 'RMS'];
                  return [`${num.toFixed(3)} m/s²`, 'RMS'];
                }}
              />

              <Legend wrapperStyle={{ color: '#e5e7eb' }} />

              <Line
                type="monotone"
                dataKey="rms"
                name="RMS (m/s²)"
                stroke="#34d399"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />

              {data.length > 20 && (
                <Brush
                  dataKey="timestamp"
                  height={30}
                  stroke="#9ca3af"
                  tickFormatter={safeFormatTimestamp}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}