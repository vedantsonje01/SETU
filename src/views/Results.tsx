/* Sections 3 & 4 — Match results.
   Found flow: ranked shortlist → confirm resolves both records.
   Family flow with no match: case saved, 6-digit token issued (print view). */

import { useState } from "react";
import { useApp } from "../store/app";
import { api } from "../lib/api";
import { MatchCard } from "../components/MatchCard";
import { Button, Panel, EmptyState } from "../components/ui";
import {
  ArrowLeftIcon, CheckCircleIcon, MagnifyingGlassIcon, PrinterIcon, HouseIcon,
} from "@phosphor-icons/react";

export function Results() {
  const { flow, navigate, setFlow, refreshPending } = useApp();
  const [idx, setIdx] = useState(0);
  const [resolved, setResolved] = useState(false);

  if (!flow) { navigate({ name: "home" }); return null; }

  const { matches, createdCase, mode } = flow;
  const current = matches[idx];

  async function confirm() {
    if (!current || !createdCase) return;
    await api.resolveCase(createdCase.case_id, current.case_id);
    refreshPending();
    setResolved(true);
  }

  /* ---- Resolved success ---- */
  if (resolved && current) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-10 anim-rise">
        <Panel className="p-8 text-center">
          <div className="mx-auto grid place-items-center w-16 h-16 rounded-full bg-system-soft text-system mb-4">
            <CheckCircleIcon size={40} weight="fill" />
          </div>
          <h1 className="text-2xl font-bold text-ink">Reunited</h1>
          <p className="mt-2 text-muted">Both records are now marked resolved.</p>
          <div className="mt-5 grid sm:grid-cols-2 gap-3 text-left">
            <div className="rounded-[10px] bg-surface-2 border border-line p-3">
              <p className="text-xs text-muted">This record</p>
              <p className="num font-semibold">{createdCase?.case_id}</p>
            </div>
            <div className="rounded-[10px] bg-surface-2 border border-line p-3">
              <p className="text-xs text-muted">Matched with</p>
              <p className="num font-semibold">{current.case_id}</p>
            </div>
          </div>
          {current.reporter_mobile && (
            <p className="mt-4 text-sm">Call family: <span className="num font-bold">{current.reporter_mobile}</span></p>
          )}
          <Button className="mt-6" onClick={() => { setFlow(null); navigate({ name: "home" }); }}>
            <HouseIcon size={18} /> Done
          </Button>
        </Panel>
      </div>
    );
  }

  /* ---- No matches: pending + token (family) ---- */
  if (matches.length === 0 || idx >= matches.length) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-10 anim-rise">
        <button onClick={() => { setFlow(null); navigate({ name: "home" }); }}
          className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink mb-4">
          <ArrowLeftIcon size={16} /> Home
        </button>
        <Panel className="p-8">
          <EmptyState
            icon={<MagnifyingGlassIcon size={40} weight="duotone" />}
            title={idx > 0 ? "No more matches" : "No match yet"}
            body={mode === "family"
              ? "We searched every center. The case is saved and will match automatically the moment this person is found."
              : "No family report matches yet. The person is held at this center and will auto-match when family reports."}
          />

          {createdCase && (() => {
            const eta = api.avgResolutionHours((c) => c.state === createdCase.state) ?? api.avgResolutionHours();
            return eta != null ? (
              <p className="text-center text-sm text-muted mb-3">
                Typical reunification time for similar cases: <span className="num font-semibold text-ink">~{eta}h</span>.
              </p>
            ) : null;
          })()}

          {createdCase && (
            <div className="mt-2 rounded-card border-2 border-dashed border-decision bg-decision-soft/40 p-6 text-center">
              <p className="text-sm font-semibold text-decision uppercase tracking-wide">Case token</p>
              <p className="num text-5xl font-bold tracking-widest text-ink mt-1">{createdCase.token}</p>
              <p className="mt-2 text-sm text-muted">
                {mode === "family"
                  ? "Hand this slip to the family. Quote it at any center, anytime, to check status."
                  : "Reference for this held person."}
              </p>
              <Button variant="ghost" className="mt-4" onClick={() => window.print()}>
                <PrinterIcon size={18} /> Print slip
              </Button>
            </div>
          )}

          <div className="flex justify-center mt-6">
            <Button onClick={() => { setFlow(null); navigate({ name: "home" }); }}>Done</Button>
          </div>
        </Panel>
      </div>
    );
  }

  /* ---- Ranked shortlist ---- */
  return (
    <div className="max-w-3xl mx-auto px-5 py-8 anim-rise">
      <button onClick={() => { setFlow(null); navigate({ name: "home" }); }}
        className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink mb-4">
        <ArrowLeftIcon size={16} /> Home
      </button>

      <div className="flex items-baseline justify-between mb-1">
        <h1 className="text-2xl font-bold text-ink">
          {matches.length} possible {matches.length === 1 ? "match" : "matches"}
        </h1>
        <span className="num text-sm text-muted">Showing {idx + 1} of {matches.length}</span>
      </div>
      <p className="text-sm text-muted mb-4">
        Cross-matched against the <strong>{mode === "found" ? "family-reporting (missing)" : "found-person"}</strong> dashboard.
        Confirming closes <strong>both</strong> records.
      </p>

      <MatchCard
        match={current}
        primary
        onConfirm={confirm}
        onDismiss={() => setIdx((i) => i + 1)}
      />

      {matches.length > idx + 1 && (
        <p className="mt-4 text-sm text-muted">
          {matches.length - idx - 1} lower-confidence {matches.length - idx - 1 === 1 ? "match" : "matches"} remain. Dismiss to review the next.
        </p>
      )}
    </div>
  );
}
