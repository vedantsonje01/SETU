/* Lightweight SVG donut/pie chart — no charting dependency. */

export interface Slice { label: string; value: number; color: string; }

const TAU = Math.PI * 2;
function arc(cx: number, cy: number, r: number, a0: number, a1: number, inner: number) {
  const p = (ang: number, rad: number) => [cx + rad * Math.cos(ang - Math.PI / 2), cy + rad * Math.sin(ang - Math.PI / 2)];
  const [x0, y0] = p(a0, r), [x1, y1] = p(a1, r);
  const [ix1, iy1] = p(a1, inner), [ix0, iy0] = p(a0, inner);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1} L${ix1},${iy1} A${inner},${inner} 0 ${large} 0 ${ix0},${iy0} Z`;
}

export function PieChart({ data, size = 180, total, centerLabel }: {
  data: Slice[]; size?: number; total?: number; centerLabel?: string;
}) {
  const sum = data.reduce((a, s) => a + s.value, 0);
  const cx = size / 2, cy = size / 2, r = size / 2 - 2, inner = r * 0.58;

  let acc = 0;
  const slices = data.filter((s) => s.value > 0).map((s) => {
    const a0 = (acc / sum) * TAU;
    acc += s.value;
    const a1 = (acc / sum) * TAU;
    return { ...s, a0, a1, pct: Math.round((s.value / sum) * 100) };
  });

  return (
    <div className="flex items-center gap-5 flex-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        {sum === 0 && <circle cx={cx} cy={cy} r={r} fill="var(--color-line)" />}
        {slices.length === 1
          ? <circle cx={cx} cy={cy} r={(r + inner) / 2} fill="none" stroke={slices[0].color} strokeWidth={r - inner} />
          : slices.map((s, i) => <path key={i} d={arc(cx, cy, r, s.a0, s.a1, inner)} fill={s.color} />)}
        <text x={cx} y={cy - 4} textAnchor="middle" className="num" fontSize={22} fontWeight={700} fill="var(--color-ink)">
          {total ?? sum}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize={11} fill="var(--color-muted)">
          {centerLabel ?? "total"}
        </text>
      </svg>
      <ul className="space-y-1.5 text-sm">
        {slices.map((s, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: s.color }} />
            <span className="text-ink">{s.label}</span>
            <span className="num text-muted ml-auto pl-3">{s.value} <span className="text-faint">({s.pct}%)</span></span>
          </li>
        ))}
      </ul>
    </div>
  );
}
