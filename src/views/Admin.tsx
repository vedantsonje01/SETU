/* Section 7 — Admin / Collector: live stats + coverage map + zone alerts. */

import { useEffect, useMemo, useState } from "react";
import { useApp } from "../store/app";
import { api } from "../lib/api";
import { LeafletMap } from "../components/LeafletMap";
import { PieChart } from "../components/PieChart";
import { Panel, Spinner } from "../components/ui";
import { InfoDot } from "../components/InfoDot";
import { AGE_BANDS } from "../lib/refs";
import type { CaseRecord } from "../types";
import { ArrowLeftIcon, WarningIcon } from "@phosphor-icons/react";

export function Admin() {
  const { navigate } = useApp();
  const [cases, setCases] = useState<CaseRecord[] | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    const load = () => api.getAllCases().then((c) => { if (alive) { setCases(c); setTick((t) => t + 1); } });
    load();
    const id = setInterval(load, 5000); // live refresh
    return () => { alive = false; clearInterval(id); };
  }, []);

  const stats = useMemo(() => {
    if (!cases) return null;
    const total = cases.length;
    const resolved = cases.filter((c) => c.status === "resolved").length;
    const pending = cases.filter((c) => c.status === "pending").length;
    const escalated = cases.filter((c) => c.status === "escalated").length;
    const hospital = cases.filter((c) => c.status === "hospital").length;
    const avg = api.avgResolutionHours();
    return { total, resolved, pending, escalated, hospital, pct: total ? Math.round((resolved / total) * 100) : 0, avg };
  }, [cases]);

  // #12 — zone-wise statistics.
  const zoneStats = useMemo(() => {
    if (!cases) return [];
    const m = new Map<string, { total: number; open: number; resolved: number; escalated: number; rh: number[] }>();
    for (const c of cases) {
      const z = m.get(c.zone) ?? { total: 0, open: 0, resolved: 0, escalated: 0, rh: [] };
      z.total++;
      if (c.status === "resolved") z.resolved++; else z.open++;
      if (c.status === "escalated") z.escalated++;
      if (c.status === "resolved" && c.resolution_hours != null) z.rh.push(c.resolution_hours);
      m.set(c.zone, z);
    }
    return [...m.entries()]
      .map(([zone, z]) => ({
        zone, total: z.total, open: z.open, resolved: z.resolved, escalated: z.escalated,
        avg: z.rh.length ? Math.round((z.rh.reduce((a, b) => a + b, 0) / z.rh.length) * 10) / 10 : null,
      }))
      .sort((a, b) => b.open - a.open || b.total - a.total);
  }, [cases]);

  // Pending cases by age band (pie).
  const pendingByAge = useMemo(() => {
    if (!cases) return [];
    const palette = ["#3a5a8c", "#2f6fed", "#0d9488", "#15803d", "#d97706", "#dc2626", "#94a3b8"];
    const counts = new Map<string, number>();
    cases.filter((c) => c.status === "pending").forEach((c) => counts.set(c.age_band, (counts.get(c.age_band) ?? 0) + 1));
    return AGE_BANDS.map((b, i) => ({ label: b, value: counts.get(b) ?? 0, color: palette[i % palette.length] }))
      .filter((s) => s.value > 0);
  }, [cases]);

  // #7 — live rush areas: open cases grouped by location (the actual ghats/nodes).
  const rush = useMemo(() => {
    if (!cases) return [];
    const m = new Map<string, number>();
    cases.filter((c) => c.status !== "resolved").forEach((c) =>
      m.set(c.last_seen_location ?? c.zone, (m.get(c.last_seen_location ?? c.zone) ?? 0) + 1));
    const arr = [...m.entries()].map(([place, n]) => ({ place, n })).sort((a, b) => b.n - a.n);
    const max = arr[0]?.n ?? 1;
    return arr.slice(0, 6).map((r) => ({ ...r, pct: Math.round((r.n / max) * 100) }));
  }, [cases]);

  return (
    <div className="max-w-6xl mx-auto px-5 py-8 anim-rise">
      <button onClick={() => navigate({ name: "home" })}
        className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink mb-4">
        <ArrowLeftIcon size={16} /> Operator view
      </button>

      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-ink">Collector dashboard</h1>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-system bg-system-soft px-2.5 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-system animate-pulse" /> LIVE
        </span>
      </div>
      <p className="text-sm text-muted mb-5">Across all centers · refreshes every 5s <span className="num text-faint">(update #{tick})</span></p>

      {!stats ? <Spinner label="Loading…" /> : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
            <Stat label="Total cases" value={stats.total} />
            <Stat label="Resolved" value={`${stats.resolved}`} sub={`${stats.pct}%`} tone="system" />
            <Stat label="Pending" value={stats.pending} tone="decision" />
            <Stat label="Escalated" value={stats.escalated} tone="alert" />
            <Stat label="Hospital" value={stats.hospital} />
            <Stat label="Avg resolution" value={stats.avg ?? "—"} sub="h"
              info="Mean reunification time computed from historically resolved cases in the dataset (resolution_hours). Indicative only." />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <Panel className="lg:col-span-2 p-5">
              <h2 className="text-lg font-bold text-ink mb-1">Live coverage map</h2>
              <p className="text-sm text-muted mb-4">Real geography: police, chokepoints, CCTV and live open cases.</p>
              <LeafletMap cases={cases ?? []} />
            </Panel>

            <div className="space-y-6">
            <Panel className="p-5">
              <h2 className="text-lg font-bold text-ink mb-1 flex items-center gap-1.5">
                Live rush areas
                <InfoDot text="Locations with the most open (unresolved) cases right now. Updates every 5 seconds. Use to redeploy volunteers and announcements to the busiest points." />
              </h2>
              <p className="text-xs text-muted mb-3">Highest open-case load by location.</p>
              {rush.length === 0
                ? <p className="text-sm text-muted">No open cases.</p>
                : (
                  <div className="space-y-2.5">
                    {rush.map((r) => (
                      <div key={r.place}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1.5 font-medium text-ink truncate">
                            {r.n >= 5 && <WarningIcon size={15} className="text-alert" weight="fill" />}
                            {r.place}
                          </span>
                          <span className="num font-bold text-muted shrink-0">{r.n}</span>
                        </div>
                        <div className="mt-1 h-1.5 rounded-full bg-surface-2 overflow-hidden">
                          <div className="h-full rounded-full bg-decision" style={{ width: `${r.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </Panel>

            <Panel className="p-5">
              <h2 className="text-lg font-bold text-ink mb-1 flex items-center gap-1.5">
                Pending cases by age band
                <InfoDot text="Breakdown of currently pending (unresolved) cases by age band. The elderly bands are the highest-risk group at the mela." />
              </h2>
              <p className="text-xs text-muted mb-3">Where the open caseload sits.</p>
              {pendingByAge.length === 0
                ? <p className="text-sm text-muted">No pending cases.</p>
                : <PieChart data={pendingByAge} centerLabel="pending" />}
            </Panel>
            </div>
          </div>

          {/* #12 — zone-wise statistics */}
          <Panel className="mt-6 p-5">
            <h2 className="text-lg font-bold text-ink mb-1 flex items-center gap-1.5">
              Zone-wise statistics
              <InfoDot text="Per-zone breakdown across all 32 administrative zones. Open = unresolved (pending + escalated). Avg resolution is the mean of resolved cases' resolution_hours in that zone." />
            </h2>
            <p className="text-xs text-muted mb-3">Sorted by current open load.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted border-b border-line">
                    <th className="py-2 pr-3 font-semibold">Zone</th>
                    <th className="py-2 px-3 font-semibold text-right">Total</th>
                    <th className="py-2 px-3 font-semibold text-right">Open</th>
                    <th className="py-2 px-3 font-semibold text-right">Resolved</th>
                    <th className="py-2 px-3 font-semibold text-right">Escalated</th>
                    <th className="py-2 pl-3 font-semibold text-right">Avg res (h)</th>
                  </tr>
                </thead>
                <tbody>
                  {zoneStats.map((z) => (
                    <tr key={z.zone} className="border-b border-line last:border-0">
                      <td className="py-2 pr-3 font-medium text-ink">{z.zone}</td>
                      <td className="py-2 px-3 num text-right text-muted">{z.total}</td>
                      <td className={`py-2 px-3 num text-right font-semibold ${z.open >= 5 ? "text-alert" : z.open > 0 ? "text-decision" : "text-faint"}`}>{z.open}</td>
                      <td className="py-2 px-3 num text-right text-system">{z.resolved}</td>
                      <td className="py-2 px-3 num text-right text-muted">{z.escalated}</td>
                      <td className="py-2 pl-3 num text-right text-muted">{z.avg ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, sub, tone, info }: { label: string; value: string | number; sub?: string; tone?: "system" | "decision" | "alert"; info?: string }) {
  const toneCls = tone === "system" ? "text-system" : tone === "decision" ? "text-decision" : tone === "alert" ? "text-alert" : "text-ink";
  return (
    <Panel className="p-4">
      <p className="text-xs text-muted uppercase tracking-wide flex items-center gap-1">{label}{info && <InfoDot text={info} />}</p>
      <p className={`num text-3xl font-bold mt-1 ${toneCls}`}>
        {value}{sub && <span className="text-base font-semibold text-muted ml-1.5">{sub}</span>}
      </p>
    </Panel>
  );
}
