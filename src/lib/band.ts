/* Safety-band (QR) helpers. For non-verbal vulnerable people (small children,
   dementia) a religious band carries a QR. The details are encoded directly in
   the QR's URL fragment, so a finder scanning with any phone sees the card with
   NO backend lookup required (fully offline / no-server). */

export interface BandData {
  person: string;   // name of the missing/at-risk person
  family: string;   // name of family member
  contact: string;  // family contact
  alt?: string;     // alternate contact (optional)
}

/* encodeURIComponent makes the JSON pure-ASCII (so btoa is safe for Hindi/Marathi names). */
export function encodeBand(d: BandData): string {
  return btoa(encodeURIComponent(JSON.stringify(d)));
}

export function decodeBand(s: string): BandData | null {
  try {
    const d = JSON.parse(decodeURIComponent(atob(s)));
    if (d && typeof d.person === "string" && typeof d.contact === "string") return d as BandData;
    return null;
  } catch {
    return null;
  }
}

/** Full URL a phone opens when it scans the band. */
export function bandURL(d: BandData): string {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#band=${encodeBand(d)}`;
}

/** If the current URL is a scanned band, return its data. */
export function bandFromHash(): BandData | null {
  const h = window.location.hash;
  const m = h.match(/^#band=(.+)$/);
  return m ? decodeBand(m[1]) : null;
}

/** Extract band data from raw text decoded off a printed QR.
   Handles: our URL (…#band=payload), a bare base64 payload, or plain JSON. */
export function parseScanned(text: string): BandData | null {
  const t = text.trim();
  const m = t.match(/#band=(.+)$/);
  if (m) return decodeBand(m[1]);
  const fromB64 = decodeBand(t);
  if (fromB64) return fromB64;
  try {
    const j = JSON.parse(t);
    if (j && typeof j.person === "string" && typeof j.contact === "string") return j as BandData;
  } catch { /* not json */ }
  return null;
}
