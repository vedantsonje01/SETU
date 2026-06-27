/* Match Card — confidence + per-signal breakdown. The trust-building
   centerpiece: the operator sees WHY two records matched, no name needed. */

import { Button, Chip, Panel } from "./ui";
import { InfoDot } from "./InfoDot";
import { hoursSince, distanceLabel } from "../lib/api";
import type { MatchResult } from "../types";
import { CheckCircleIcon, XCircleIcon, PhoneIcon, MapPinIcon } from "@phosphor-icons/react";

function confidenceTone(c: number) {
  if (c >= 0.75) return { ring: "var(--color-system)", soft: "bg-system-soft", text: "text-system" };
  if (c >= 0.6) return { ring: "var(--color-action)", soft: "bg-action-soft", text: "text-action" };
  return { ring: "var(--color-decision)", soft: "bg-decision-soft", text: "text-decision" };
}

function ConfidenceRing({ value }: { value: number }) {
  const tone = confidenceTone(value);
  const pct = Math.round(value * 100);
  return (
    <div
      className="shrink-0 grid place-items-center w-20 h-20 rounded-full"
      style={{ background: `conic-gradient(${tone.ring} ${pct * 3.6}deg, var(--color-line) 0deg)` }}
    >
      <div className="grid place-items-center w-[58px] h-[58px] rounded-full bg-surface">
        <span className={`num text-xl font-bold ${tone.text}`}>{pct}%</span>
      </div>
    </div>
  );
}

export function MatchCard({
  match, primary, onConfirm, onDismiss,
}: { match: MatchResult; primary?: boolean; onConfirm: () => void; onDismiss: () => void }) {
  const s = match.signals;
  const tone = confidenceTone(match.confidence);

  const chips = [
    { label: `desc ${Math.round(s.description * 100)}%`, tone: s.description >= 0.5 ? "good" : "weak" },
    { label: `age ${s.age === 1 ? "✓" : s.age === 0.5 ? "~" : "✗"}`, tone: s.age >= 0.5 ? "good" : "neutral" },
    { label: `state ${s.state ? "✓" : "✗"}`, tone: s.state ? "good" : "neutral" },
    { label: `lang ${s.language === 1 ? "✓" : s.language === 0.5 ? "~" : "✗"}`, tone: s.language >= 0.5 ? "good" : "neutral" },
    { label: s.same_zone ? "same zone" : s.adjacent_zone ? "adj. zone" : "zone ✗", tone: (s.same_zone || s.adjacent_zone) ? "good" : "neutral" },
    { label: `${s.time_hours_apart}h apart`, tone: s.time_hours_apart <= 12 ? "good" : "weak" },
  ] as const;

  return (
    <Panel className={`p-5 ${primary ? "ring-2 ring-action ring-offset-2" : ""}`}>
      <div className="flex gap-4">
        <ConfidenceRing value={match.confidence} />
        {match.photo && (
          <img src={match.photo} alt="Reported person"
            className="w-20 h-20 object-cover rounded-[10px] border border-line shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded ${tone.soft} ${tone.text}`}>
              {match.confidence >= 0.75 ? "Strong match" : match.confidence >= 0.6 ? "Likely match" : "Possible match"}
            </span>
            <span className="num text-sm text-muted">{match.case_id}</span>
            <InfoDot text="Confidence is a weighted blend of description (35%), age (20%), state (15%), language (10%), time (10%) and location (10%). It is decision support, not proof — always confirm identity with the family." />
          </div>
          {match.name && <p className="mt-1.5 text-base font-bold text-ink">{match.name}</p>}
          <p className="mt-1 font-semibold text-ink">
            Reported {match.type} at {match.center_id} · {Math.round(hoursSince(match.created_at))}h ago
          </p>
          <p className="text-sm text-muted flex items-center gap-1.5 flex-wrap">
            <span>{match.gender} · {match.age_band} · {match.state} · {match.language}</span>
            {match.last_seen_location && <span className="flex items-center gap-1"><MapPinIcon size={13} /> {match.last_seen_location}</span>}
            {distanceLabel(match.distance_m) && (
              <span className="text-action font-medium">≈ {distanceLabel(match.distance_m)} away</span>
            )}
          </p>
          <p className="mt-1.5 text-ink">{match.physical_description}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {chips.map((c, i) => <Chip key={i} label={c.label} tone={c.tone} />)}
          </div>

          {match.reporter_mobile && (
            <p className="mt-3 flex items-center gap-2 text-sm">
              <PhoneIcon size={16} className="text-system" />
              <span className="text-muted">Family contact:</span>
              <span className="num font-semibold text-ink">{match.reporter_mobile}</span>
            </p>
          )}

          <div className="mt-4 flex gap-3">
            <Button variant="system" onClick={onConfirm}>
              <CheckCircleIcon size={18} weight="bold" /> Confirm match
            </Button>
            <Button variant="ghost" onClick={onDismiss}>
              <XCircleIcon size={18} /> Not them, try next
            </Button>
          </div>
        </div>
      </div>
    </Panel>
  );
}
