export default function Gauge90({
  label,
  value = 0,
  min = 0,
  max = 100,
  units = '',
  size = 200,
  goodMin,
  goodMax,
  warnMargin = 0,
}) {
  const clamped = clamp(value, min, max);
  const pct = (clamped - min) / (max - min || 1);
  const startAngle = -180;
  const endAngle = 0;
  const angle = startAngle + pct * (endAngle - startAngle);

  const w = size;
  const h = size * 0.75;
  const cx = size * 0.6;
  const cy = size * 0.6;
  const r = size * 0.45;

  const arcStart = polar(cx, cy, r, startAngle);
  const arcEnd = polar(cx, cy, r, endAngle);

  const hasGood = isFinite(goodMin) && isFinite(goodMax) && goodMax > goodMin;
  const goodStartAngle = startAngle + ((goodMin - min) / (max - min || 1)) * (endAngle - startAngle);
  const goodEndAngle = startAngle + ((goodMax - min) / (max - min || 1)) * (endAngle - startAngle);

  const needleLen = r * 0.98;
  const needle = polar(cx, cy, needleLen, angle);

  const status = computeStatus(value, goodMin, goodMax, warnMargin);

  return (
    <div className={`g90-wrap status-${status}`} style={{ width: w }}>
      <svg width={w} height={h} viewBox={`0 0 ${w*1.25} ${h}`} role="img" aria-label={`${label} gauge`}>
        {/* background arc */}
        <path
          d={`M ${arcStart.x} ${arcStart.y} A ${r} ${r} 0 0 1 ${arcEnd.x} ${arcEnd.y}`}
          className="g90-arc-bg"
          fill="none"
        />

        {/* good range arc */}
        {hasGood && (
          <path
            d={arcPath(cx, cy, r, clampAngle(goodStartAngle, startAngle, endAngle), clampAngle(goodEndAngle, startAngle, endAngle))}
            className="g90-arc-good"
            fill="none"
          />
        )}

        {/* ticks */}
        {ticks(5).map((t, i) => {
          const a = startAngle + t * (endAngle - startAngle);
          const p1 = polar(cx, cy, r * 0.9, a);
          const p2 = polar(cx, cy, r, a);
          return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} className="g90-tick" />;
        })}

        {/* needle + hub */}
        <line x1={cx} y1={cy} x2={needle.x} y2={needle.y} className="g90-needle" />
        <circle cx={cx} cy={cy} r={r * 0.05} className="g90-hub" />
      </svg>

      {/* labels below */}
      <div className="g90-text">
        <div className="g90-label">{label}</div>
        <div className="g90-value">
          {format(value)}{units ? ` ${units}` : ''}
        </div>
        <div className="g90-range">
          {format(min)} – {format(max)}
        </div>
      </div>
    </div>
  );
}

function computeStatus(v, goodMin, goodMax, warnMargin = 0) {
  if (!isFinite(v) || !isFinite(goodMin) || !isFinite(goodMax) || goodMax <= goodMin) return 'unknown';
  if (v >= goodMin && v <= goodMax) return 'ok';
  if (v >= (goodMin - warnMargin) && v <= (goodMax + warnMargin)) return 'warn';
  return 'bad';
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, Number(n)));
}

function format(n) {
  if (n === null || n === undefined || isNaN(n)) return '-';
  const v = Number(n);
  return Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2);
}

function polar(cx, cy, r, deg) {
  const th = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(th), y: cy + r * Math.sin(th) };
}

function arcPath(cx, cy, r, startDeg, endDeg) {
  const p1 = polar(cx, cy, r, startDeg);
  const p2 = polar(cx, cy, r, endDeg);
  return `M ${p1.x} ${p1.y} A ${r} ${r} 0 0 1 ${p2.x} ${p2.y}`;
}

function clampAngle(a, min, max) {
  return Math.max(min, Math.min(max, a));
}

function ticks(n) {
  return Array.from({ length: n }, (_, i) => i / (n - 1 || 1));
}