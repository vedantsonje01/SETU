/* #3 — Map integration (Leaflet + OpenStreetMap tiles) for the collector
   dashboard. Plots real police / chokepoint / CCTV geography and live open
   cases, with toggleable layers. Vector circleMarkers (no icon assets). */

import { useEffect, useRef, useState } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import { api, haversine } from "../lib/api";
import type { CaseRecord } from "../types";

const COVER_M = 500;

export function LeafletMap({ cases }: { cases: CaseRecord[] }) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layers = useRef<Record<string, L.LayerGroup>>({});
  const [show, setShow] = useState({ police: true, gaps: true, cctv: false, cases: true });

  // init map once
  useEffect(() => {
    if (!elRef.current || mapRef.current) return;
    const geo = api.geo();
    const map = L.map(elRef.current, { scrollWheelZoom: true }).setView([19.995, 73.78], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors", maxZoom: 19,
    }).addTo(map);

    const help = [...geo.police, ...geo.cctv];
    const covered = (p: { lat: number; lng: number }) =>
      help.some((h) => haversine(p.lat, p.lng, h.lat, h.lng) <= COVER_M);

    // police
    const police = L.layerGroup();
    geo.police.forEach((p) => {
      L.circle([p.lat, p.lng], { radius: COVER_M, color: "#2f6fed", weight: 1, fillOpacity: 0.05 }).addTo(police);
      L.circleMarker([p.lat, p.lng], { radius: 6, color: "#2f6fed", weight: 2, fillColor: "#fff", fillOpacity: 1 })
        .bindPopup(`<b>${p.name}</b><br>Police station`).addTo(police);
    });

    // chokepoints split into covered / gaps
    const gaps = L.layerGroup();
    const ok = L.layerGroup();
    geo.chokepoints.forEach((c) => {
      const cov = covered(c);
      L.circleMarker([c.lat, c.lng], {
        radius: c.category === "Transfer node" ? 7 : 5,
        color: cov ? "#15803d" : "#dc2626", weight: 1.5,
        fillColor: cov ? "#15803d" : "#dc2626", fillOpacity: 0.85,
      }).bindPopup(`<b>${c.name}</b><br>${c.category}<br>${cov ? "Covered" : "⚠ No help within 500 m"}`)
        .addTo(cov ? ok : gaps);
    });

    // cctv
    const cctv = L.layerGroup();
    geo.cctv.forEach((c) => {
      L.circleMarker([c.lat, c.lng], { radius: 1.6, color: "#94a3b8", weight: 0, fillColor: "#94a3b8", fillOpacity: 0.7 }).addTo(cctv);
    });

    ok.addTo(map); // covered points always visible
    layers.current = { police, gaps, cctv, ok };
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 60);

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // open-case layer (updates with data)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    layers.current.cases?.remove();
    const g = L.layerGroup();
    cases.filter((c) => c.status !== "resolved" && c.lat != null && c.lng != null).forEach((c) => {
      const col = c.status === "escalated" ? "#dc2626" : "#d97706";
      L.circleMarker([c.lat!, c.lng!], { radius: 4, color: col, weight: 1, fillColor: col, fillOpacity: 0.6 })
        .bindPopup(`<b>${c.case_id}</b><br>${c.gender}, ${c.age_band}, ${c.state}<br>${c.zone} · ${c.status}`)
        .addTo(g);
    });
    layers.current.cases = g;
    if (show.cases) g.addTo(map);
  }, [cases, show.cases]);

  // toggle layers
  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    const set = (key: keyof typeof show, layer?: L.LayerGroup) => {
      if (!layer) return;
      if (show[key]) layer.addTo(map); else layer.remove();
    };
    set("police", layers.current.police);
    set("gaps", layers.current.gaps);
    set("cctv", layers.current.cctv);
  }, [show]);

  const Toggle = ({ k, label, color }: { k: keyof typeof show; label: string; color: string }) => (
    <label className="flex items-center gap-1.5 text-sm font-medium text-ink cursor-pointer">
      <input type="checkbox" checked={show[k]} onChange={(e) => setShow((s) => ({ ...s, [k]: e.target.checked }))} />
      <span className="w-3 h-3 rounded-full" style={{ background: color }} /> {label}
    </label>
  );

  return (
    <div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 mb-3">
        <Toggle k="police" label="Police" color="#2f6fed" />
        <Toggle k="gaps" label="Coverage gaps" color="#dc2626" />
        <Toggle k="cases" label="Open cases" color="#d97706" />
        <Toggle k="cctv" label="CCTV (1280)" color="#94a3b8" />
      </div>
      <div ref={elRef} className="w-full rounded-card border border-line" style={{ height: 460 }} />
      <p className="mt-2 text-xs text-muted">Tiles © OpenStreetMap. Green/red = chokepoint coverage within {COVER_M} m of police or CCTV.</p>
    </div>
  );
}
