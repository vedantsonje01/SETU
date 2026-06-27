/* Coverage map — self-contained SVG plot of the real CSV coordinates.
   Offline, no tile CDN. A chokepoint is "covered" when a police station or
   CCTV camera lies within 500 m. (Leaflet upgrade lands in change #3.) */

import { useMemo, useState } from "react";
import { api, haversine } from "../lib/api";

const W = 760, H = 480, PAD = 30, COVER_M = 500;

export function CoverageMap() {
  const [transferOnly, setTransferOnly] = useState(false);
  const [showCctv, setShowCctv] = useState(false);
  const geo = api.geo();

  const model = useMemo(() => {
    const all = [...geo.zones, ...geo.police, ...geo.chokepoints];
    if (!all.length) return null;
    const lats = all.map((p) => p.lat), lngs = all.map((p) => p.lng);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const proj = (p: { lat: number; lng: number }) => ({
      x: ((p.lng - minLng) / (maxLng - minLng || 1)) * (W - 2 * PAD) + PAD,
      y: ((maxLat - p.lat) / (maxLat - minLat || 1)) * (H - 2 * PAD) + PAD,
    });
    const midLat = (minLat + maxLat) / 2;
    const spanXm = haversine(midLat, minLng, midLat, maxLng);
    const radiusPx = (COVER_M / spanXm) * (W - 2 * PAD);

    const help = [...geo.police, ...geo.cctv];
    const points = geo.chokepoints.map((c) => {
      let nearest = Infinity;
      for (const h of help) { const d = haversine(c.lat, c.lng, h.lat, h.lng); if (d < nearest) nearest = d; }
      return { ...c, covered: nearest <= COVER_M, nearest: Math.round(nearest) };
    });
    return {
      proj, radiusPx, points,
      covered: points.filter((p) => p.covered).length,
      gaps: points.filter((p) => !p.covered),
    };
  }, [geo]);

  if (!model) return <p className="text-sm text-muted">Map data unavailable.</p>;
  const { proj, radiusPx, points, covered, gaps } = model;
  const shown = transferOnly ? points.filter((p) => p.category === "Transfer node") : points;

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
        <div className="flex items-center gap-4 text-sm text-muted flex-wrap">
          <Legend color="var(--color-action)" label="Police" ring />
          <Legend color="var(--color-faint)" label="CCTV" dot />
          <Legend color="var(--color-system)" label="Covered" />
          <Legend color="var(--color-alert)" label="Gap" />
        </div>
        <div className="flex items-center gap-4 text-sm font-medium text-ink">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showCctv} onChange={(e) => setShowCctv(e.target.checked)} /> CCTV
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={transferOnly} onChange={(e) => setTransferOnly(e.target.checked)} /> Transfer nodes only
          </label>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto rounded-card border border-line bg-surface-2">
        {geo.police.map((h, i) => {
          const { x, y } = proj(h);
          return <circle key={`r${i}`} cx={x} cy={y} r={radiusPx} fill="var(--color-system)" opacity={0.05} />;
        })}
        {showCctv && geo.cctv.map((c, i) => {
          const { x, y } = proj(c);
          return <circle key={`cc${i}`} cx={x} cy={y} r={1.4} fill="var(--color-faint)" opacity={0.6} />;
        })}
        {geo.police.map((p, i) => {
          const { x, y } = proj(p);
          return <circle key={`p${i}`} cx={x} cy={y} r={5} fill="none" stroke="var(--color-action)" strokeWidth={2.5} />;
        })}
        {shown.map((p, i) => {
          const { x, y } = proj(p);
          const col = p.covered ? "var(--color-system)" : "var(--color-alert)";
          return (
            <g key={`k${i}`}>
              {!p.covered && <circle cx={x} cy={y} r={10} fill="var(--color-alert)" opacity={0.18} />}
              <circle cx={x} cy={y} r={p.category === "Transfer node" ? 6 : 4} fill={col} />
            </g>
          );
        })}
      </svg>

      <p className="mt-3 text-sm text-muted">
        <span className="num font-semibold text-system">{covered}</span> covered ·{" "}
        <span className="num font-semibold text-alert">{gaps.length}</span> {gaps.length === 1 ? "gap" : "gaps"} (no police/CCTV within {COVER_M} m).
      </p>
    </div>
  );
}

function Legend({ color, label, ring, dot }: { color: string; label: string; ring?: boolean; dot?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={dot ? "w-1.5 h-1.5 rounded-full" : "w-3 h-3 rounded-full"}
        style={ring ? { border: `2.5px solid ${color}` } : { background: color }} />
      {label}
    </span>
  );
}
