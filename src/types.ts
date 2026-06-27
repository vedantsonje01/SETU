/* Shared domain types — mirror the planned FastAPI `cases` schema. */

export type CaseType = "missing" | "found";
export type CaseStatus = "pending" | "matched" | "resolved" | "escalated" | "hospital";

/** Operator intake mode. "family" reports a MISSING person; "found" registers a FOUND person. */
export type IntakeMode = "found" | "family";

export interface CaseRecord {
  case_id: string;
  type: CaseType;
  status: CaseStatus;
  name?: string;
  gender: string;
  age_band: string;
  state: string;
  district?: string;
  language: string;
  zone: string;
  landmark?: string;
  last_seen_location?: string;
  lat?: number;
  lng?: number;
  physical_description: string;
  photo?: string; // resized JPEG data URL (optional)
  reporter_mobile?: string;
  center_id: string;
  token: string;
  reported_at: string;
  created_at: string;
  resolution_hours?: number;
  matched_case_id?: string;
  escalated_to?: string;
  hospital?: string;
}

export interface MatchSignals {
  description: number;
  age: number;
  state: number;
  language: number;
  time_hours_apart: number;
  adjacent_zone: boolean;
  same_zone: boolean;
}

export interface MatchResult extends CaseRecord {
  confidence: number;
  signals: MatchSignals;
  distance_m?: number; // straight-line distance from the query location (#6)
}

export interface DuplicateResult {
  duplicate: boolean;
  existing?: CaseRecord;
  similarity?: number;
}
