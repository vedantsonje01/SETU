/* Shared UI primitives — Tailwind + locked design tokens.
   One radius scale, one accent, AA contrast on every interactive element. */

import type { ButtonHTMLAttributes, ReactNode } from "react";

/* ---------- Button ---------- */
type Variant = "primary" | "system" | "danger" | "ghost";
const VARIANTS: Record<Variant, string> = {
  primary: "bg-navy text-white hover:bg-navy-dark",
  system: "bg-system text-white hover:brightness-110",
  danger: "bg-alert text-white hover:brightness-110",
  ghost: "bg-surface text-ink border border-line-strong hover:bg-surface-2",
};
export function Button({
  variant = "primary", className = "", children, ...rest
}: { variant?: Variant } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-[10px] px-5 py-2.5
        font-semibold transition active:translate-y-px disabled:opacity-50
        disabled:pointer-events-none ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ---------- Panel / Card ---------- */
export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-surface border border-line rounded-card shadow-sm ${className}`}>
      {children}
    </div>
  );
}

/* ---------- Field (label above input) ---------- */
export function Field({
  label, required, hint, error, children,
}: { label: string; required?: boolean; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-ink">
        {label} {required && <span className="text-alert">*</span>}
      </label>
      {children}
      {error
        ? <p className="text-sm text-alert">{error}</p>
        : hint && <p className="text-sm text-muted">{hint}</p>}
    </div>
  );
}

/* ---------- OptionGroup (tap-to-select buttons) ---------- */
export function OptionGroup({
  options, value, onChange, columns = 0,
}: { options: string[]; value?: string; onChange: (v: string) => void; columns?: number }) {
  return (
    <div
      className={columns ? "grid gap-2" : "flex flex-wrap gap-2"}
      style={columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))` } : undefined}
    >
      {options.map((opt) => {
        const on = value === opt;
        return (
          <button
            key={opt}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(opt)}
            className={`px-3.5 py-2 rounded-[10px] text-sm font-medium border transition
              active:translate-y-px text-left
              ${on
                ? "bg-action text-white border-action"
                : "bg-surface text-ink border-line-strong hover:border-action hover:bg-action-soft/40"}`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Status badge ---------- */
type Status = "pending" | "matched" | "resolved" | "escalated" | "hospital";
const BADGE: Record<Status, string> = {
  pending: "bg-decision-soft text-decision",
  matched: "bg-action-soft text-action",
  resolved: "bg-system-soft text-system",
  escalated: "bg-alert-soft text-alert",
  hospital: "bg-teal-100 text-teal-700",
};
export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${BADGE[status]}`}>
      {status}
    </span>
  );
}

/* ---------- Signal chip (match breakdown) ---------- */
export function Chip({
  label, tone = "neutral",
}: { label: string; tone?: "good" | "weak" | "neutral" }) {
  const tones = {
    good: "bg-system-soft text-system",
    weak: "bg-decision-soft text-decision",
    neutral: "bg-surface-2 text-muted border border-line",
  };
  return <span className={`num inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${tones[tone]}`}>{label}</span>;
}

/* ---------- Score pill (prediction / match %) ---------- */
export function ScorePill({ value, size = "md" }: { value: number; size?: "sm" | "md" }) {
  const pct = Math.round(value * 100);
  const cls = value >= 0.75 ? "bg-system-soft text-system"
    : value >= 0.5 ? "bg-action-soft text-action"
    : value >= 0.3 ? "bg-decision-soft text-decision"
    : "bg-surface-2 text-muted border border-line";
  const dim = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1";
  return <span className={`num font-bold rounded-full ${cls} ${dim}`}>{pct}%</span>;
}

/* ---------- Spinner ---------- */
export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-muted">
      <span className="inline-block w-5 h-5 border-2 border-line-strong border-t-action rounded-full animate-spin" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}

/* ---------- Empty state ---------- */
export function EmptyState({ icon, title, body }: { icon?: ReactNode; title: string; body?: string }) {
  return (
    <div className="text-center py-12 px-6">
      {icon && <div className="mx-auto mb-3 text-faint flex justify-center">{icon}</div>}
      <h3 className="text-lg font-bold text-ink">{title}</h3>
      {body && <p className="mt-1 text-muted max-w-md mx-auto">{body}</p>}
    </div>
  );
}
