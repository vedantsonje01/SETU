# Kumbh Setu — Frontend

Offline-first missing-persons system for Kumbh Mela 2027. Two surfaces:
**Operator Terminal** (center laptop) and **Admin / Collector** dashboard.

## Stack
- Vite + React 18 + TypeScript
- Tailwind v4 (CSS-first theme, design tokens in `src/index.css`)
- Phosphor icons · Motion (minimal) · self-contained SVG coverage map (no tile CDN)
- Mock API + 6-signal matcher in `src/lib/api.ts` — swap for FastAPI `/api/*` later

Runtime needs **no internet**: built output is static files served on the center laptop,
talking only to a local FastAPI backend.

## Run
```bash
npm install      # once
npm run dev      # http://localhost:5173
npm run build    # static bundle in dist/
```
Admin view: append `#admin` to the URL, or use the Admin toggle in the top bar.

## Structure
```
src/
  lib/        api.ts (mock + matcher) · refs.ts (data + geo) · i18n.ts (EN/HI/MR)
  store/      app.tsx (navigation, language, pending count, intake flow)
  components/ TopBar · ui (primitives) · MatchCard · CoverageMap
  views/      Home · Intake · Results · TokenLookup · Escalation · Admin
  types.ts    domain types (mirror the cases schema)
```

## Demo path
1. Home → **Found person** → fill gender + age (+desc) → Find match → confirm → Reunited.
2. Home → **Family reporting** → enter details → no match → 6-digit token issued → print.
3. Home → **Check a token** → `482917` → status card.
4. Home → **Case dashboard** → aging cases, escalate >12h, hospital transfer.
5. Top bar **Admin** → live stats + coverage map (toggle transfer-nodes-only).

## Swapping in the real backend
Replace the bodies in `src/lib/api.ts` with `fetch` calls to FastAPI. The view layer is
unchanged — it only depends on the `api` object's method signatures.
