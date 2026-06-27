/* Section 6 — Escalation dashboard.
   Open cases aging in real time; >12h flagged red; one-click escalate to the
   nearest police station; hospital-transfer capture. */

import { useEffect, useMemo, useState } from "react";
import { useApp } from "../store/app";
import { api, hoursSince, haversine } from "../lib/api";
import { Button, Panel, Spinner, StatusBadge, EmptyState } from "../components/ui";
import { InfoDot } from "../components/InfoDot";
import type { CaseRecord } from "../types";
import {
  ArrowLeftIcon, WarningIcon, FirstAidIcon, ShieldChevronIcon, CheckCircleIcon, MagnifyingGlassIcon,
} from "@phosphor-icons/react";

type Filter = "all" | "pending" | "escalated" | "hospital";

/** Nearest police station to a case's coordinates (haversine over real stations). */
function nearestStation(c: CaseRecord): string {
  const police = api.geo().police;
  if (!police.length) return "Nearest police station";
  if (c.lat == null || c.lng == null) return police[0].name;
  let best = police[0], bestD = Infinity;
  for (const p of police) {
    const d = haversine(c.lat, c.lng, p.lat, p.lng);
    if (d < bestD) { bestD = d; best = p; }
  }
  return best.name;
}

export function Escalation() {
  const { navigate, refreshPending } = useApp();
  const [cases, setCases] = useState<CaseRecord[] | null>(null);
  const [hospitalFor, setHospitalFor] = useState<CaseRecord | null>(null);
  const [hospitalName, setHospitalName] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const load = () => api.getOpenCases().then(setCases);
  useEffect(() => { load(); }, []);

  // #8 — search + status filter over the open-case list.
  const filtered = useMemo(() => {
    if (!cases) return [];
    const q = query.trim().toLowerCase();
    return cases.filter((c) => {
      if (filter !== "all" && c.status !== filter) return false;
      if (!q) return true;
      return [c.case_id, c.token, c.gender, c.age_band, c.state, c.district, c.language,
        c.zone, c.last_seen_location, c.center_id, c.physical_description, c.name]
        .filter(Boolean).join(" ").toLowerCase().includes(q);
    });
  }, [cases, query, filter]);

  async function escalate(c: CaseRecord) {
    await api.escalate(c.case_id, nearestStation(c));
    await load(); refreshPending();
  }
  async function resolve(c: CaseRecord) {
    await api.resolveCase(c.case_id, c.matched_case_id);
    await load(); refreshPending();
  }
  async function transferHospital() {
    if (!hospitalFor || !hospitalName.trim()) return;
    await api.transferHospital(hospitalFor.case_id, hospitalName.trim());
    setHospitalFor(null); setHospitalName("");
    await load(); refreshPending();
  }

  return (
    <div className="max-w-5xl mx-auto px-5 py-8 anim-rise">
      <button onClick={() => navigate({ name: "home" })}
        className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink mb-4">
        <ArrowLeftIcon size={16} /> Home
      </button>

      <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
        Case dashboard
        <InfoDot text="Open cases only, oldest first. Cases unresolved beyond 12 hours are auto-flagged red and should be escalated to the nearest police station. Escalation routing uses straight-line distance to real station coordinates." />
      </h1>
      <p className="text-sm text-muted mb-4">Open cases, oldest first. Cases over 12 hours are flagged for escalation.</p>

      {/* #8 — search + filter toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[240px]">
          <MagnifyingGlassIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search case id, token, state, language, location, description…"
            className="w-full pl-9 pr-3 py-2.5 rounded-[10px] border border-line-strong bg-surface focus:border-action transition"
          />
        </div>
        <div className="flex gap-1.5">
          {(["all", "pending", "escalated", "hospital"] as Filter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-[10px] text-sm font-medium capitalize border transition
                ${filter === f ? "bg-action text-white border-action" : "bg-surface text-ink border-line-strong hover:border-action"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {!cases ? <Spinner label="Loading cases…" /> :
        filtered.length === 0
          ? <Panel className="p-6"><EmptyState icon={<CheckCircleIcon size={40} weight="duotone" />} title={query || filter !== "all" ? "No matching cases" : "No open cases"} body={query || filter !== "all" ? "Adjust the search or filter." : "Everything is resolved."} /></Panel>
          : (
            <Panel className="overflow-hidden">
              <p className="num text-xs text-muted px-4 py-2 border-b border-line bg-surface-2">
                {filtered.length} {filter === "all" ? "open" : filter} case{filtered.length === 1 ? "" : "s"}{filtered.length > 60 ? " · showing first 60" : ""}
              </p>
              <div className="divide-y divide-line">
                {filtered.slice(0, 60).map((c) => {
                  const age = hoursSince(c.created_at);
                  const overdue = age >= 12 && c.status === "pending";
                  return (
                    <div key={c.case_id}
                      className={`flex items-center gap-4 px-4 py-3 ${overdue ? "bg-alert-soft/40" : ""}`}>
                      <span className={`num text-sm font-bold w-14 text-right ${overdue ? "text-alert" : "text-muted"}`}>
                        {Math.round(age)}h
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="num text-sm font-semibold text-ink">{c.case_id}</span>
                          {c.name && <span className="text-sm font-semibold text-ink">· {c.name}</span>}
                          <StatusBadge status={c.status} />
                          <span className={`text-xs px-2 py-0.5 rounded-full ${c.type === "missing" ? "bg-navy-soft text-navy" : "bg-action-soft text-action"}`}>
                            {c.type}
                          </span>
                        </div>
                        <p className="text-sm text-muted truncate">
                          {c.gender}, {c.age_band}, {c.state} · {c.language} · {c.center_id}
                          {c.hospital && <span className="text-alert"> · hospital: {c.hospital}</span>}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0 items-center">
                        <Button variant="system" className="!px-3 !py-1.5 text-sm"
                          onClick={() => resolve(c)} title="Mark this case resolved">
                          <CheckCircleIcon size={16} weight="bold" /> Resolve
                        </Button>
                        {c.status === "pending" && (
                          <>
                            <Button variant="ghost" className="!px-3 !py-1.5 text-sm"
                              onClick={() => setHospitalFor(c)}>
                              <FirstAidIcon size={16} /> Hospital
                            </Button>
                            <Button variant={overdue ? "danger" : "ghost"} className="!px-3 !py-1.5 text-sm"
                              onClick={() => escalate(c)}>
                              {overdue ? <WarningIcon size={16} weight="fill" /> : <ShieldChevronIcon size={16} />} Escalate
                            </Button>
                          </>
                        )}
                        {c.status === "escalated" && (
                          <span className="num text-xs text-alert">→ {c.escalated_to}</span>
                        )}
                        {c.status === "hospital" && (
                          <span className="num text-xs text-teal-700 flex items-center gap-1">
                            <FirstAidIcon size={13} /> {c.hospital}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          )}

      {/* Hospital transfer modal */}
      {hospitalFor && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" role="dialog" aria-modal>
          <Panel className="max-w-md w-full p-6 anim-rise">
            <div className="flex items-center gap-2 text-alert mb-2">
              <FirstAidIcon size={22} weight="fill" />
              <h2 className="text-lg font-bold text-ink">Hospital transfer</h2>
            </div>
            <p className="text-sm text-muted">Record the hospital for <span className="num">{hospitalFor.case_id}</span>. This is required before closing a transfer.</p>
            <input autoFocus value={hospitalName} onChange={(e) => setHospitalName(e.target.value)}
              placeholder="Hospital name"
              className="mt-3 w-full px-3.5 py-2.5 rounded-[10px] border border-line-strong bg-surface focus:border-action transition" />
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="ghost" onClick={() => { setHospitalFor(null); setHospitalName(""); }}>Cancel</Button>
              <Button variant="danger" onClick={transferHospital} disabled={!hospitalName.trim()}>Record transfer</Button>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
