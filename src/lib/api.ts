/* ============================================================
   Mock API layer + smart-search matcher.
   Loads the real dataset (data.ts), then serves it in-memory with
   simulated latency. Mirrors the planned FastAPI surface — swap the
   method bodies for fetch('/api/*') later, the views stay unchanged.
   ============================================================ */

import { AGE_BANDS } from "./refs";
import { loadGeo, loadCases, type GeoData } from "./data";
import type { CaseRecord, CaseType, MatchResult, DuplicateResult, MatchSignals } from "../types";

const delay = (ms = 220) => new Promise((r) => setTimeout(r, ms));

/* The dataset is dated to the 2027 mela. Anchor "now" to the most recent
   report so ages are positive and realistic (and the 12h+ flags fire).
   Set from the data on init; operator-created cases are stamped with it too. */
let appNow = Date.now();
const nowISO = () => new Date(appNow).toISOString();
export const hoursSince = (iso: string) => (appNow - +new Date(iso)) / 3.6e6;

let CASES: CaseRecord[] = [];
let GEO: GeoData = { zones: [], police: [], chokepoints: [], cctv: [] };
let ready = false;
let counter = 900000;
const genCaseId = () => `KMP-2027-9${String(++counter).slice(-4)}`;
const genToken = () => String(100000 + ((counter * 7919) % 900000));

/* ---------- Matching internals ---------- */
function descSimilarity(a = "", b = ""): number {
  const stop = new Set(["the", "and", "has", "with", "near", "wearing", "man", "woman"]);
  const norm = (s: string) =>
    new Set(s.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter((w) => w.length > 2 && !stop.has(w)));
  const sa = norm(a), sb = norm(b);
  if (!sa.size || !sb.size) return 0;
  let inter = 0;
  sa.forEach((w) => { if (sb.has(w)) inter++; });
  return inter / (sa.size + sb.size - inter);
}

const sameLangFamily = (a: string, b: string) => {
  const fam = ["Hindi", "Bhojpuri", "Awadhi", "Maithili"];
  return fam.includes(a) && fam.includes(b);
};

function score(q: Partial<CaseRecord>, c: CaseRecord): { confidence: number; signals: MatchSignals; distance_m?: number } | null {
  if (q.gender && c.gender && q.gender !== "Unknown" && c.gender !== "Unknown" && q.gender !== c.gender) return null;

  const desc = descSimilarity(q.physical_description, c.physical_description);

  let age = 0;
  if (q.age_band === c.age_band) age = 1;
  else {
    const i = AGE_BANDS.indexOf(q.age_band ?? ""), j = AGE_BANDS.indexOf(c.age_band);
    if (i >= 0 && j >= 0 && Math.abs(i - j) === 1) age = 0.5;
  }

  const state = q.state && q.state === c.state ? 1 : 0;

  let lang = 0;
  if (q.language && q.language === c.language) lang = 1;
  else if (sameLangFamily(q.language ?? "", c.language)) lang = 0.5;

  const hrs = Math.abs(+new Date(q.reported_at ?? nowISO()) - +new Date(c.reported_at)) / 3.6e6;
  const time = Math.max(0, 1 - hrs / 48);

  // Geographic proximity: prefer real coordinates, fall back to zone match.
  let zone = 0, metres: number | undefined;
  if (q.lat != null && q.lng != null && c.lat != null && c.lng != null) {
    metres = haversine(q.lat, q.lng, c.lat, c.lng);
    zone = metres <= 300 ? 1 : metres <= 1500 ? 0.5 : 0;
  } else if (q.zone && c.zone) {
    zone = q.zone === c.zone ? 1 : 0;
  }

  const confidence = 0.35 * desc + 0.2 * age + 0.15 * state + 0.1 * lang + 0.1 * time + 0.1 * zone;

  return {
    confidence: Math.round(confidence * 100) / 100,
    distance_m: metres != null ? Math.round(metres) : undefined,
    signals: {
      description: Math.round(desc * 100) / 100,
      age, state, language: lang,
      time_hours_apart: Math.round(hrs * 10) / 10,
      adjacent_zone: zone === 0.5,
      same_zone: zone === 1,
    },
  };
}

/** Human distance label, e.g. "320 m" or "1.4 km". */
export function distanceLabel(m?: number): string | null {
  if (m == null) return null;
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`;
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

interface SimilarOpts {
  type?: CaseType;        // restrict candidate type
  openOnly?: boolean;     // exclude resolved
  excludeId?: string;
  limit?: number;
  min?: number;           // confidence floor
}

function rank(query: Partial<CaseRecord>, opts: SimilarOpts = {}): MatchResult[] {
  const { type, openOnly = true, excludeId, limit = 5, min = 0.45 } = opts;
  const out: MatchResult[] = [];
  for (const c of CASES) {
    if (excludeId && c.case_id === excludeId) continue;
    if (type && c.type !== type) continue;
    if (openOnly && c.status === "resolved") continue;
    const s = score(query, c);
    if (s && s.confidence >= min) out.push({ ...c, ...s });
  }
  out.sort((a, b) => b.confidence - a.confidence);
  return out.slice(0, limit);
}

/* ---------- Public API ---------- */
export const api = {
  async init() {
    if (ready) return;
    GEO = await loadGeo();
    CASES = await loadCases(GEO);
    appNow = CASES.reduce((m, c) => Math.max(m, +new Date(c.reported_at)), 0) || Date.now();
    ready = true;
  },
  isReady: () => ready,
  geo: () => GEO,

  async createCase(record: Partial<CaseRecord> & { type: CaseType }): Promise<CaseRecord> {
    await delay();
    if (!record.gender || !record.age_band) throw new Error("gender and age_band are required");
    const zoneCentroid = GEO.zones.find((z) => z.name === record.zone);
    const c: CaseRecord = {
      gender: "", age_band: "", state: "", language: "", zone: "",
      physical_description: "", center_id: "Center 03 — Trimbak Rd",
      ...record,
      lat: record.lat ?? zoneCentroid?.lat,
      lng: record.lng ?? zoneCentroid?.lng,
      case_id: genCaseId(),
      token: genToken(),
      status: "pending",
      created_at: nowISO(),
      reported_at: record.reported_at ?? nowISO(),
    } as CaseRecord;
    CASES.push(c);
    return c;
  },

  /** Cross-match against the OPPOSITE type (found↔missing), open cases only. */
  async findMatches(query: Partial<CaseRecord> & { type: CaseType }): Promise<MatchResult[]> {
    await delay(420);
    const target: CaseType = query.type === "found" ? "missing" : "found";
    return rank(query, { type: target, openOnly: true, limit: 5, min: 0.45 });
  },

  /** Generalized similarity search — prediction list (#1) & smart search (#9). */
  async findSimilar(query: Partial<CaseRecord>, opts: SimilarOpts = {}): Promise<MatchResult[]> {
    await delay(380);
    return rank(query, { openOnly: true, limit: 8, min: 0.2, ...opts });
  },

  async checkDuplicate(record: Partial<CaseRecord>): Promise<DuplicateResult> {
    await delay(180);
    for (const c of CASES) {
      if (c.type !== "missing" || c.status === "resolved") continue;
      if (c.gender === record.gender && c.age_band === record.age_band && c.state === record.state) {
        const sim = descSimilarity(record.physical_description, c.physical_description);
        if (sim > 0.55) return { duplicate: true, existing: c, similarity: sim };
      }
    }
    return { duplicate: false };
  },

  async lookupToken(token: string) {
    await delay(220);
    const c = CASES.find((x) => x.token === token.trim());
    return c ? { found: true as const, case: c } : { found: false as const };
  },

  async getOpenCases(): Promise<CaseRecord[]> {
    await delay(100);
    return CASES.filter((c) => c.status !== "resolved")
      .slice()
      .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
  },

  async getAllCases(): Promise<CaseRecord[]> {
    await delay(100);
    return CASES.slice();
  },

  async resolveCase(caseId: string, matchedId?: string): Promise<void> {
    await delay(160);
    const c = CASES.find((x) => x.case_id === caseId);
    if (c) { c.status = "resolved"; c.matched_case_id = matchedId; }
    if (matchedId) {
      const m = CASES.find((x) => x.case_id === matchedId);
      if (m) { m.status = "resolved"; m.matched_case_id = caseId; }
    }
  },

  async escalate(caseId: string, station: string): Promise<void> {
    await delay(160);
    const c = CASES.find((x) => x.case_id === caseId);
    if (c) { c.status = "escalated"; c.escalated_to = station; }
  },

  async transferHospital(caseId: string, hospital: string): Promise<void> {
    await delay(160);
    const c = CASES.find((x) => x.case_id === caseId);
    if (c) { c.status = "hospital"; c.hospital = hospital; }
  },

  /** Avg resolution time (hours) from historically resolved cases (#4). */
  avgResolutionHours(filter?: (c: CaseRecord) => boolean): number | null {
    const r = CASES.filter((c) => c.status === "resolved" && c.resolution_hours != null && (!filter || filter(c)));
    if (!r.length) return null;
    return Math.round((r.reduce((a, c) => a + (c.resolution_hours ?? 0), 0) / r.length) * 10) / 10;
  },
};

export { haversine };
