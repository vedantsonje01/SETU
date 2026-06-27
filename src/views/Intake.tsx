/* Section 2 — Intake form (reused by Found and Family flows).
   Section 4 duplicate-check is wired into the Family submit path. */

import { useState, useRef, useEffect, type ChangeEvent } from "react";
import { useApp } from "../store/app";
import { api } from "../lib/api";
import { GENDERS, AGE_BANDS, STATES, LANGUAGES, ZONES } from "../lib/refs";
import { Button, Field, OptionGroup, Panel } from "../components/ui";
import { PredictionList } from "../components/PredictionList";
import { InfoDot } from "../components/InfoDot";
import { fileToResizedDataURL } from "../lib/image";
import type { CaseRecord, DuplicateResult, IntakeMode, MatchResult } from "../types";
import {
  ArrowLeftIcon, MicrophoneIcon, UserFocusIcon, UsersThreeIcon, WarningIcon, CameraIcon, XIcon,
} from "@phosphor-icons/react";

const selectCls =
  "w-full px-3.5 py-2.5 rounded-[10px] border border-line-strong bg-surface text-ink " +
  "focus:border-action transition";

/* Speech-recognition locale per spoken language (multilingual dictation). */
const SPEECH_LOCALE: Record<string, string> = {
  Hindi: "hi-IN", Bhojpuri: "hi-IN", Awadhi: "hi-IN", Maithili: "hi-IN",
  Marathi: "mr-IN", Bengali: "bn-IN", Gujarati: "gu-IN",
  Kannada: "kn-IN", Tamil: "ta-IN", Telugu: "te-IN",
};
const UI_LOCALE: Record<string, string> = { EN: "en-IN", HI: "hi-IN", MR: "mr-IN" };

export function Intake({ mode }: { mode: IntakeMode }) {
  const { navigate, setFlow, refreshPending, lang } = useApp();
  const isFamily = mode === "family";

  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [state, setState] = useState("");
  const [language, setLanguage] = useState("");
  const [zone, setZone] = useState("");
  const [landmark, setLandmark] = useState("");
  const [desc, setDesc] = useState("");
  const [mobile, setMobile] = useState("");
  const [photo, setPhoto] = useState<string>("");

  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dup, setDup] = useState<DuplicateResult | null>(null);
  const [listening, setListening] = useState(false);
  const recogRef = useRef<any>(null);

  const [predictions, setPredictions] = useState<MatchResult[]>([]);
  const [predicting, setPredicting] = useState(false);

  const valid = gender && age;

  /* ---- #1 Live prediction: similar existing records across all zones ---- */
  useEffect(() => {
    if (!gender || !age) { setPredictions([]); return; }
    let cancelled = false;
    setPredicting(true);
    const handle = setTimeout(async () => {
      const zc = api.geo().zones.find((z) => z.name === zone);
      const res = await api.findSimilar(
        { type: isFamily ? "missing" : "found", gender, age_band: age, state, language, zone,
          lat: zc?.lat, lng: zc?.lng, physical_description: desc },
        { openOnly: true, limit: 6, min: 0.25 },
      );
      if (!cancelled) { setPredictions(res); setPredicting(false); }
    }, 350);
    return () => { cancelled = true; clearTimeout(handle); };
  }, [gender, age, state, language, zone, desc, isFamily]);

  /* ---- #2 Multilingual voice dictation (Web Speech API, graceful fallback) ---- */
  const dictLocale = SPEECH_LOCALE[language] ?? UI_LOCALE[lang] ?? "en-IN";
  const dictate = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Voice capture is unavailable in this browser. Please type the description."); return; }
    if (listening) { recogRef.current?.stop(); return; }
    const r = new SR();
    r.lang = dictLocale;
    r.interimResults = false;
    r.continuous = false;
    r.onresult = (e: any) => {
      let txt = "";
      for (let i = e.resultIndex; i < e.results.length; i++) txt += e.results[i][0].transcript;
      setDesc((d) => (d ? d + " " : "") + txt.trim());
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recogRef.current = r;
    setListening(true);
    r.start();
  };

  const buildQuery = (): Partial<CaseRecord> & { type: "missing" | "found" } => {
    const zc = api.geo().zones.find((z) => z.name === zone);
    return {
      type: isFamily ? "missing" : "found",
      gender, age_band: age, state, language, zone, landmark,
      lat: zc?.lat, lng: zc?.lng,
      physical_description: desc, reporter_mobile: mobile, photo: photo || undefined,
      center_id: "Center 03 — Trimbak Rd",
    };
  };

  async function onPhoto(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try { setPhoto(await fileToResizedDataURL(f)); }
    catch { alert("Could not read that image. Try another file."); }
  }

  async function run() {
    setBusy(true);
    const query = buildQuery();
    const created = await api.createCase(query);
    const matches = await api.findMatches(query);
    setFlow({ mode, query, matches, createdCase: created });
    refreshPending();
    setBusy(false);
    navigate({ name: "results" });
  }

  async function submit() {
    setTouched(true);
    if (!valid || busy) return;
    if (isFamily) {
      setBusy(true);
      const d = await api.checkDuplicate(buildQuery());
      setBusy(false);
      if (d.duplicate) { setDup(d); return; }
    }
    await run();
  }

  const Title = isFamily ? UsersThreeIcon : UserFocusIcon;

  return (
    <div className="max-w-6xl mx-auto px-5 py-8 anim-rise">
      <button onClick={() => navigate({ name: "home" })}
        className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink mb-4">
        <ArrowLeftIcon size={16} /> Back
      </button>

      <div className="flex items-center gap-3 mb-6">
        <span className={`grid place-items-center w-12 h-12 rounded-xl
          ${isFamily ? "bg-navy-soft text-navy" : "bg-action-soft text-action"}`}>
          <Title size={26} weight="duotone" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-ink">
            {isFamily ? "Family reporting missing" : "Missing person brought in"}
          </h1>
          <p className="text-sm text-muted">
            {isFamily
              ? "Take down what the family knows, then search every center."
              : "Capture the person in front of you, then find their family."}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6 items-start">
        <div className="lg:col-span-3">
      <Panel className="p-6 grid gap-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Gender" required error={touched && !gender ? "Required" : undefined}>
            <OptionGroup options={GENDERS} value={gender} onChange={setGender} />
          </Field>
          <Field label="Age band" required error={touched && !age ? "Required" : undefined}>
            <OptionGroup options={AGE_BANDS} value={age} onChange={setAge} columns={4} />
          </Field>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <Field label="State of origin">
            <select className={selectCls} value={state} onChange={(e) => setState(e.target.value)}>
              <option value="">Select…</option>
              {STATES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Language">
            <select className={selectCls} value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="">Select…</option>
              {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
            </select>
          </Field>
          <Field label="Zone last seen">
            <select className={selectCls} value={zone} onChange={(e) => setZone(e.target.value)}>
              <option value="">Select…</option>
              {ZONES.map((z) => <option key={z}>{z.replace("_", " ")}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Physical description"
          hint={`Clothing, build, distinguishing features. Tap the mic to dictate — voice language: ${language || "auto"} (${dictLocale}).`}>
          <div className="relative">
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              placeholder=""
              className="w-full px-3.5 py-2.5 pr-12 rounded-[10px] border border-line-strong bg-surface
                text-ink focus:border-action transition resize-y"
            />
            <button
              type="button" onClick={dictate}
              title={`Dictate in ${dictLocale}`}
              aria-label={`Dictate description in ${dictLocale}`}
              className={`absolute top-2.5 right-2.5 grid place-items-center w-9 h-9 rounded-lg transition
                ${listening ? "bg-alert text-white animate-pulse" : "bg-surface-2 text-muted hover:text-action border border-line"}`}
            >
              <MicrophoneIcon size={18} weight={listening ? "fill" : "regular"} />
            </button>
            {listening && (
              <span className="absolute bottom-2 right-12 num text-xs text-alert">● listening ({dictLocale})</span>
            )}
          </div>
        </Field>

        <Field label="Photo (optional)" hint="A photo of the person greatly improves reunification. Stored resized; shown to operators on matches.">
          {photo ? (
            <div className="flex items-center gap-3">
              <img src={photo} alt="Uploaded preview" className="w-24 h-24 object-cover rounded-[10px] border border-line" />
              <Button variant="ghost" onClick={() => setPhoto("")} className="!px-3 !py-1.5 text-sm">
                <XIcon size={16} /> Remove
              </Button>
            </div>
          ) : (
            <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] border border-dashed
              border-line-strong bg-surface-2 text-muted hover:border-action hover:text-action cursor-pointer w-fit transition">
              <CameraIcon size={18} /> Upload / take photo
              <input type="file" accept="image/*" capture="environment" onChange={onPhoto} className="hidden" />
            </label>
          )}
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Landmark (optional)">
            <input className={selectCls} value={landmark} onChange={(e) => setLandmark(e.target.value)}
              placeholder="" />
          </Field>
          {isFamily && (
            <Field label="Family contact mobile (optional)">
              <input className={`${selectCls} num`} value={mobile} onChange={(e) => setMobile(e.target.value)}
                inputMode="numeric" placeholder="" />
            </Field>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-line">
          <Button variant="ghost" onClick={() => navigate({ name: "home" })}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? "Working…" : isFamily ? "Search all centers" : "Find match"}
          </Button>
        </div>
      </Panel>
        </div>

        {/* #1 — live prediction across all zones (sticky side panel) */}
        <div className="lg:col-span-2 lg:sticky lg:top-20">
          <Panel className="p-5">
            <div className="flex items-center justify-between mb-1 gap-2">
              <h2 className="text-lg font-bold text-ink flex items-center gap-1.5">
                Similar records
                <InfoDot text="Predicted matches ranked by similarity across every center. Scores are approximate and meant to surface possible duplicates or cross-center matches — verify before acting." />
              </h2>
              <span className="text-xs text-muted shrink-0">Live · updates as you type</span>
            </div>
            <p className="text-sm text-muted mb-3">
              Across all zones, ranked by likelihood. Check before creating a record to avoid duplicates and catch a cross-center match.
            </p>
            {gender && age
              ? <PredictionList items={predictions} loading={predicting}
                  emptyHint="No similar open records found yet. Add a description to sharpen the score." />
              : <p className="text-sm text-muted py-8 text-center">Select gender and age to see similar records.</p>}
          </Panel>
        </div>
      </div>

      {/* Section 4 — duplicate prompt */}
      {dup?.duplicate && dup.existing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" role="dialog" aria-modal>
          <Panel className="max-w-md w-full p-6 anim-rise">
            <div className="flex items-center gap-2 text-decision mb-2">
              <WarningIcon size={22} weight="fill" />
              <h2 className="text-lg font-bold">Possible duplicate</h2>
            </div>
            <p className="text-sm text-muted">
              A similar missing report already exists:
            </p>
            <div className="mt-3 rounded-[10px] bg-surface-2 border border-line p-3 text-sm">
              <p className="num font-semibold">{dup.existing.case_id}</p>
              <p className="text-muted mt-0.5">
                {dup.existing.gender}, {dup.existing.age_band}, {dup.existing.state} ·
                filed at {dup.existing.center_id}
              </p>
              <p className="mt-1">{dup.existing.physical_description}</p>
            </div>
            <p className="mt-3 text-sm text-ink font-medium">Is this the same person?</p>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="ghost" onClick={async () => { setDup(null); await run(); }}>
                No, create new
              </Button>
              <Button variant="system" onClick={() => navigate({ name: "token" })}>
                Yes, it is the same
              </Button>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
