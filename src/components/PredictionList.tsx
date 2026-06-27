/* Prediction / similarity list — ranked existing records across all zones,
   each with a % score. Used live during intake (#1) and by smart search (#9). */

import { ScorePill, StatusBadge, Spinner } from "./ui";
import { hoursSince, distanceLabel } from "../lib/api";
import type { MatchResult } from "../types";
import { MapPinIcon } from "@phosphor-icons/react";

export function PredictionList({
  items, loading, emptyHint, onPick,
}: {
  items: MatchResult[];
  loading?: boolean;
  emptyHint?: string;
  onPick?: (m: MatchResult) => void;
}) {
  if (loading) return <div className="py-4"><Spinner label="Scoring records across all zones…" /></div>;
  if (!items.length) return <p className="text-sm text-muted py-3">{emptyHint ?? "No similar records yet."}</p>;

  return (
    <ul className="divide-y divide-line">
      {items.map((m) => {
        const Row = onPick ? "button" : "div";
        return (
          <li key={m.case_id}>
            <Row
              {...(onPick ? { onClick: () => onPick(m), type: "button" as const } : {})}
              className={`w-full text-left flex items-center gap-3 py-2.5 ${onPick ? "hover:bg-surface-2 transition px-2 -mx-2 rounded-lg" : ""}`}
            >
              <ScorePill value={m.confidence} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="num text-sm font-semibold text-ink">{m.case_id}</span>
                  <StatusBadge status={m.status} />
                  <span className={`text-xs px-2 py-0.5 rounded-full ${m.type === "missing" ? "bg-navy-soft text-navy" : "bg-action-soft text-action"}`}>{m.type}</span>
                </div>
                <p className="text-sm text-muted truncate">
                  {m.gender}, {m.age_band}, {m.state} · {m.language}
                  {m.physical_description ? ` · ${m.physical_description}` : ""}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs text-muted flex items-center gap-1 justify-end">
                  <MapPinIcon size={12} /> {m.zone}
                </p>
                <p className="num text-xs text-faint">
                  {distanceLabel(m.distance_m) ? `${distanceLabel(m.distance_m)} · ` : ""}{Math.round(hoursSince(m.created_at))}h ago
                </p>
              </div>
            </Row>
          </li>
        );
      })}
    </ul>
  );
}
