/* #9 — Smart search. Free-text + structured query ranked by similarity across
   the WHOLE registry (resolved included), each result scored with a %.
   Reuses the same multi-signal scorer as matching. */

import { useEffect, useMemo, useState } from "react";
import { useApp } from "../store/app";
import { api } from "../lib/api";
import { GENDERS, AGE_BANDS, STATES, LANGUAGES, ZONES } from "../lib/refs";
import { Panel } from "../components/ui";
import { PredictionList } from "../components/PredictionList";
import { InfoDot } from "../components/InfoDot";
import type { MatchResult } from "../types";
import { ArrowLeftIcon, SparkleIcon } from "@phosphor-icons/react";

const sel = "px-3 py-2 rounded-[10px] border border-line-strong bg-surface text-sm focus:border-action transition";

export function SmartSearch() {
  const { navigate } = useApp();
  const [text, setText] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [state, setState] = useState("");
  const [language, setLanguage] = useState("");
  const [zone, setZone] = useState("");
  const [openOnly, setOpenOnly] = useState(false);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [busy, setBusy] = useState(false);

  const hasQuery = useMemo(
    () => !!(text.trim() || gender || age || state || language || zone),
    [text, gender, age, state, language, zone],
  );

  useEffect(() => {
    if (!hasQuery) { setResults([]); return; }
    let cancelled = false;
    setBusy(true);
    const h = setTimeout(async () => {
      const zc = api.geo().zones.find((z) => z.name === zone);
      const res = await api.findSimilar(
        { gender, age_band: age, state, language, zone, lat: zc?.lat, lng: zc?.lng, physical_description: text },
        { openOnly, limit: 20, min: 0.15 },
      );
      if (!cancelled) { setResults(res); setBusy(false); }
    }, 300);
    return () => { cancelled = true; clearTimeout(h); };
  }, [text, gender, age, state, language, zone, openOnly, hasQuery]);

  return (
    <div className="max-w-4xl mx-auto px-5 py-8 anim-rise">
      <button onClick={() => navigate({ name: "home" })}
        className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink mb-4">
        <ArrowLeftIcon size={16} /> Home
      </button>

      <div className="flex items-center gap-3 mb-5">
        <span className="grid place-items-center w-12 h-12 rounded-xl bg-action-soft text-action">
          <SparkleIcon size={26} weight="duotone" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
            Smart search
            <InfoDot text="Ranks the entire registry by similarity to your query using description, age, state, language, time and location. Results are scored estimates, not exact lookups — use the dashboard search for exact case-id/token." />
          </h1>
          <p className="text-sm text-muted">Describe the person. Add filters to sharpen. Ranked by match %.</p>
        </div>
      </div>

      <Panel className="p-5 grid gap-4">
        <textarea
          value={text} onChange={(e) => setText(e.target.value)} rows={2} autoFocus
          placeholder="e.g. elderly man, white kurta, walking stick, hard of hearing"
          className="w-full px-3.5 py-2.5 rounded-[10px] border border-line-strong bg-surface focus:border-action transition resize-y"
        />
        <div className="flex flex-wrap gap-2">
          <select className={sel} value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="">Any gender</option>{GENDERS.map((g) => <option key={g}>{g}</option>)}
          </select>
          <select className={sel} value={age} onChange={(e) => setAge(e.target.value)}>
            <option value="">Any age</option>{AGE_BANDS.map((a) => <option key={a}>{a}</option>)}
          </select>
          <select className={sel} value={state} onChange={(e) => setState(e.target.value)}>
            <option value="">Any state</option>{STATES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select className={sel} value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="">Any language</option>{LANGUAGES.map((l) => <option key={l}>{l}</option>)}
          </select>
          <select className={sel} value={zone} onChange={(e) => setZone(e.target.value)}>
            <option value="">Any zone</option>{ZONES.map((z) => <option key={z}>{z}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm font-medium text-ink px-2 cursor-pointer">
            <input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} /> Open cases only
          </label>
        </div>
      </Panel>

      {hasQuery && (
        <Panel className="p-5 mt-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-ink">Results</h2>
            {!busy && <span className="num text-sm text-muted">{results.length} ranked</span>}
          </div>
          <PredictionList items={results} loading={busy}
            emptyHint="No records score above the threshold. Try fewer filters or a broader description." />
        </Panel>
      )}
    </div>
  );
}
