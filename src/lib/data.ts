/* ============================================================
   Dataset loader — parses the real CSVs from /public/data and
   maps them into the app's domain model.
   Works offline at runtime (files are bundled in the build).
   ============================================================ */

import type { CaseRecord, CaseStatus } from "../types";
import { haversineMetres, type GeoPoint } from "./refs";

/* ---------- Minimal CSV parser (handles quoted fields) ---------- */
export function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c === "\r") { /* skip */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  const header = rows.shift() ?? [];
  return rows
    .filter((r) => r.length > 1)
    .map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? "").trim()])));
}

const url = (file: string) => `${import.meta.env.BASE_URL}data/${file}`;
async function fetchCSV(file: string) {
  const res = await fetch(url(file));
  if (!res.ok) throw new Error(`failed to load ${file}`);
  return parseCSV(await res.text());
}

/* ---------- Geo helpers ---------- */
export interface NamedPoint extends GeoPoint { category?: string; id?: string; }

/* Approx coordinates for the 20 last_seen_location names, derived from the
   chokepoint / zone coordinates in the dataset (prototype geolocation). */
const LOCATION_GEO: Record<string, [number, number]> = {
  "Adgaon Parking": [20.042, 73.838],
  "Bus Stand Nashik": [19.9972, 73.7799],
  "Dasak Ghat": [19.952, 73.853],
  "Dindori Road Crossing": [20.0345, 73.8033],
  "Gauri Patangan": [19.9325, 73.531],
  "Kapila Sangam": [20.012, 73.806],
  "Kushavart Kund": [19.9327, 73.5306],
  "Laxmi Narayan Ghat": [20.0065, 73.7905],
  "Madsangvi Transit": [20.066, 73.883],
  "Main Police Chowki": [19.997, 73.78],
  "Nandur Ghat": [20.0048, 73.831],
  "Nashik Road Station": [19.94884, 73.84059],
  "Panchavati Circle": [20.0067, 73.79062],
  "Rajur Bahula": [19.946, 73.673],
  "Ramkund Ghat": [20.0067, 73.79062],
  "Sadhugram Gate 1": [20.015, 73.81],
  "Sadhugram Gate 2": [20.017, 73.812],
  "Takli Sangam": [19.951, 73.842],
  "Trimbak Road": [19.9664, 73.6615],
  "Trimbakeshwar Approach": [19.9333, 73.5306],
};

function nearestZone(lat: number, lng: number, zones: NamedPoint[]): string {
  let best = zones[0]?.name ?? "Zone Area 1", bestD = Infinity;
  for (const z of zones) {
    const d = haversineMetres({ name: "", lat, lng }, z);
    if (d < bestD) { bestD = d; best = z.name; }
  }
  return best;
}

function mapStatus(s: string): { status: CaseStatus; hospital?: string } {
  switch (s) {
    case "Reunited": return { status: "resolved" };
    case "Pending": return { status: "pending" };
    case "Transferred to hospital": return { status: "hospital", hospital: "On hospital record" };
    case "Unresolved": return { status: "escalated" };
    default: return { status: "pending" };
  }
}

const tokenFor = (caseId: string) => {
  const n = parseInt(caseId.replace(/\D/g, ""), 10) || 0;
  return String(100000 + ((n * 6133) % 900000));
};

/* ---------- Public loaders ---------- */
export interface GeoData {
  zones: NamedPoint[];
  police: NamedPoint[];
  chokepoints: NamedPoint[];
  cctv: NamedPoint[];
}

export async function loadGeo(): Promise<GeoData> {
  const [z, p, ch, cc] = await Promise.all([
    fetchCSV("Zone_Boundaries.csv"),
    fetchCSV("Police_Stations.csv"),
    fetchCSV("Chokepoints_Parking.csv"),
    fetchCSV("CCTV_Locations.csv"),
  ]);
  return {
    zones: z.map((r) => ({ name: r.zone_name, lat: +r.centroid_lat, lng: +r.centroid_lng })),
    police: p.map((r) => ({ name: r.station_name, lat: +r.latitude, lng: +r.longitude })),
    chokepoints: ch.map((r) => ({ name: r.location_name, category: r.category, lat: +r.latitude, lng: +r.longitude })),
    cctv: cc.map((r) => ({ id: r.camera_id, name: r.camera_id, lat: +r.latitude, lng: +r.longitude })),
  };
}

/* The synthetic dataset spreads reports across ~2 months. For a mela dashboard
   that should read in hours/days, we compress every timestamp into a recent
   rolling window (newest report = "now", oldest = WINDOW_H ago) while keeping
   order and relative spacing. Ages then look realistic and 12h+ flags fire. */
const WINDOW_H = 120; // 5 days

export async function loadCases(geo: GeoData): Promise<CaseRecord[]> {
  const rows = await fetchCSV("Synthetic_Missing_Persons_2500.csv");

  // original timestamps (ms) to find the span
  const times = rows.map((r) => +new Date(r.reported_at.replace(" ", "T"))).filter((t) => !isNaN(t));
  const minT = Math.min(...times), maxT = Math.max(...times);
  const span = maxT - minT || 1;
  const windowMs = WINDOW_H * 3600 * 1000;
  const compress = (raw: string) => {
    const t = +new Date(raw.replace(" ", "T"));
    if (isNaN(t)) return new Date(maxT).toISOString();
    return new Date(maxT - ((maxT - t) / span) * windowMs).toISOString();
  };

  return rows.map((r) => {
    const [lat, lng] = LOCATION_GEO[r.last_seen_location] ?? [20.0, 73.78];
    const { status, hospital } = mapStatus(r.status);
    const rh = parseFloat(r.resolution_hours);
    const reported = compress(r.reported_at);
    // Name is OPTIONAL: keep it on roughly half of records (deterministic) so the
    // UI visibly mixes named and name-less cases, reflecting real intake.
    const seq = Number(r.case_id.split("-").pop()) || 0;
    const name = seq % 2 === 0 ? "" : (r.missing_person_name || "");
    return {
      case_id: r.case_id,
      type: "missing",
      status,
      name,
      gender: r.gender,
      age_band: r.age_band,
      state: r.state,
      district: r.district,
      language: r.language,
      zone: nearestZone(lat, lng, geo.zones),
      last_seen_location: r.last_seen_location,
      lat, lng,
      physical_description: r.physical_description || "",
      reporter_mobile: r.reporter_mobile || "",
      center_id: r.reporting_center,
      token: tokenFor(r.case_id),
      reported_at: reported,
      created_at: reported,
      resolution_hours: isNaN(rh) ? undefined : rh,
      hospital,
    } as CaseRecord;
  });
}
