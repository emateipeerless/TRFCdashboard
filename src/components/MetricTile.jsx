export default function MetricTile({ label, value, sub }) {
  return (
    <div className="tile2">
      <div className="tile2-label">{label}</div>
      <div className="tile2-value">{value ?? '-'}</div>
      {sub && <div className="tile2-sub">{sub}</div>}
    </div>
  );
}