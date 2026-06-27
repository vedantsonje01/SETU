/* Reference vocabulary for the intake form (matches the dataset's distinct
   values) + geo helpers. Live geography is loaded from the CSVs in data.ts. */

export const GENDERS = ["Male", "Female", "Unknown"];

export const AGE_BANDS = ["0-12", "13-17", "18-40", "41-60", "61-70", "71-80", "80+"];

export const STATES = [
  "Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Gujarat",
  "Haryana", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
  "Odisha", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh",
  "Uttarakhand", "West Bengal",
];

export const LANGUAGES = [
  "Hindi", "Marathi", "Bhojpuri", "Awadhi", "Maithili",
  "Bengali", "Gujarati", "Kannada", "Tamil", "Telugu",
];

export const ZONES = Array.from({ length: 32 }, (_, i) => `Zone Area ${i + 1}`);

export const LOCATIONS = [
  "Adgaon Parking", "Bus Stand Nashik", "Dasak Ghat", "Dindori Road Crossing",
  "Gauri Patangan", "Kapila Sangam", "Kushavart Kund", "Laxmi Narayan Ghat",
  "Madsangvi Transit", "Main Police Chowki", "Nandur Ghat", "Nashik Road Station",
  "Panchavati Circle", "Rajur Bahula", "Ramkund Ghat", "Sadhugram Gate 1",
  "Sadhugram Gate 2", "Takli Sangam", "Trimbak Road", "Trimbakeshwar Approach",
];

/* ---- Geo ---- */
export interface GeoPoint { name: string; lat: number; lng: number; }

/** Haversine distance in metres. */
export function haversineMetres(a: GeoPoint, b: GeoPoint): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
