/* Section 5 — Token lookup. Family quotes a 6-digit token at any center. */

import { useEffect, useState } from "react";
import { useApp } from "../store/app";
import { api, hoursSince } from "../lib/api";
import { Button, Panel, Spinner, StatusBadge, EmptyState } from "../components/ui";
import type { CaseRecord } from "../types";
import {
  ArrowLeftIcon, HashIcon, MagnifyingGlassIcon, MapPinIcon, ShieldWarningIcon,
  CheckCircleIcon, ClockIcon, FirstAidIcon,
} from "@phosphor-icons/react";

export function TokenLookup() {
  const { navigate } = useApp();
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ found: boolean; case?: CaseRecord } | null>(null);
  const [samples, setSamples] = useState<string[]>([]);

  // Real example tokens from the loaded dataset (pending cases).
  useEffect(() => {
    api.getOpenCases().then((cs) =>
      setSamples([...new Set(cs.filter((c) => c.status === "pending").map((c) => c.token))].slice(0, 3)),
    );
  }, []);

  async function lookup(tok: string = token) {
    const t = tok.trim();
    if (t.length < 4 || busy) return;
    setToken(t);
    setBusy(true);
    setResult(null);
    setResult(await api.lookupToken(t));
    setBusy(false);
  }

  return (
    <div className="max-w-xl mx-auto px-5 py-10 anim-rise">
      <button onClick={() => navigate({ name: "home" })}
        className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink mb-4">
        <ArrowLeftIcon size={16} /> Home
      </button>

      <div className="flex items-center gap-3 mb-6">
        <span className="grid place-items-center w-12 h-12 rounded-xl bg-decision-soft text-decision">
          <HashIcon size={26} weight="duotone" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-ink">Check a token</h1>
          <p className="text-sm text-muted">Enter the 6-digit number from the family's slip.</p>
        </div>
      </div>

      <Panel className="p-5">
        <div className="flex gap-3">
          <input
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
            onKeyDown={(e) => e.key === "Enter" && lookup()}
            inputMode="numeric"
            placeholder="482917"
            autoFocus
            className="num flex-1 text-2xl tracking-widest text-center px-4 py-3 rounded-[10px]
              border border-line-strong bg-surface focus:border-action transition"
          />
          <Button onClick={() => lookup()} disabled={busy} className="whitespace-nowrap shrink-0">
            <MagnifyingGlassIcon size={18} weight="bold" /> Look up
          </Button>
        </div>
        {samples.length > 0 && (
          <p className="mt-2 text-xs text-muted">
            Try a live token:{" "}
            {samples.map((t, i) => (
              <span key={t}>
                {i > 0 && ", "}
                <button onClick={() => lookup(t)} className="num text-action font-medium hover:underline">{t}</button>
              </span>
            ))}
          </p>
        )}
      </Panel>

      {busy && <div className="mt-6"><Spinner label="Searching all centers…" /></div>}

      {result && !busy && (
        <div className="mt-6">
          {!result.found
            ? (
              <Panel className="p-6 anim-rise">
                <EmptyState
                  icon={<HashIcon size={40} weight="duotone" />}
                  title="No case found for this token"
                  body="Double-check the 6 digits on the slip. If it still doesn't match, the family may not have the right token — you can find the person by description instead."
                />
                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-2">
                  <Button variant="ghost" onClick={() => { setToken(""); setResult(null); }}>
                    Clear &amp; re-enter
                  </Button>
                  <Button onClick={() => navigate({ name: "search" })}>
                    <MagnifyingGlassIcon size={18} weight="bold" /> Search by description
                  </Button>
                </div>
              </Panel>
            )
            : <StatusCard c={result.case!} />}
        </div>
      )}
    </div>
  );
}

function StatusCard({ c }: { c: CaseRecord }) {
  const summary = `${c.gender}, ${c.age_band}, ${c.state}`;

  const map = {
    resolved: {
      icon: <CheckCircleIcon size={28} weight="fill" />, cls: "bg-system-soft text-system",
      title: "Resolved — reunited",
      body: `This person has been reunited. Recorded at ${c.matched_case_id ? "the matched center" : c.center_id}.`,
    },
    matched: {
      icon: <MapPinIcon size={28} weight="fill" />, cls: "bg-action-soft text-action",
      title: "Match found",
      body: `Go to ${c.center_id}. The matched person is there now.`,
    },
    escalated: {
      icon: <ShieldWarningIcon size={28} weight="fill" />, cls: "bg-alert-soft text-alert",
      title: "Escalated to police",
      body: `Unresolved over 12 hours. Referred to ${c.escalated_to ?? "nearest police station"}. Quote ${c.case_id}.`,
    },
    hospital: {
      icon: <FirstAidIcon size={28} weight="fill" />, cls: "bg-teal-100 text-teal-700",
      title: "Taken to hospital",
      body: `This person was transferred to ${c.hospital ?? "a hospital"}. Contact the center for details and to arrange reunification.`,
    },
    pending: {
      icon: <ClockIcon size={28} weight="fill" />, cls: "bg-decision-soft text-decision",
      title: "Still searching",
      body: "No match yet. We are searching every center. Please check back.",
    },
  } as const;

  const v = map[c.status];
  const eta = c.status === "pending"
    ? (api.avgResolutionHours((x) => x.state === c.state) ?? api.avgResolutionHours())
    : null;

  return (
    <Panel className="p-6 anim-rise">
      <div className="flex items-start gap-4">
        <span className={`grid place-items-center w-14 h-14 rounded-xl shrink-0 ${v.cls}`}>{v.icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-ink">{v.title}</h2>
            <StatusBadge status={c.status} />
          </div>
          <p className="mt-1 text-muted">{v.body}</p>
          {eta != null && (
            <p className="mt-1 text-sm text-muted">Typical reunification time for similar cases: <span className="num font-semibold text-ink">~{eta}h</span>.</p>
          )}
          <div className="mt-4 rounded-[10px] bg-surface-2 border border-line p-3 text-sm flex gap-3">
            {c.photo && <img src={c.photo} alt="Reported person" className="w-20 h-20 object-cover rounded-lg border border-line shrink-0" />}
            <div className="min-w-0">
            {c.name && <p className="font-bold text-ink">{c.name}</p>}
            <p className="num font-semibold">{c.case_id}</p>
            <p className="text-muted mt-0.5">{summary} · {c.language}</p>
            <p className="mt-1">{c.physical_description}</p>
            <p className="num text-xs text-faint mt-2">Filed {Math.round(hoursSince(c.created_at))}h ago · token {c.token}</p>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}
