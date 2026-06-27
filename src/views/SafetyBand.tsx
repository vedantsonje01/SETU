/* Safety band (QR) — SCANNER. Bands are pre-printed; this screen reads one.
   Landing shows what the band looks like + who it's for, then a "Scan QR"
   button opens the camera on demand (camera is NOT opened automatically). */

import { useEffect, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useApp } from "../store/app";
import { Button, Panel } from "../components/ui";
import { InfoDot } from "../components/InfoDot";
import { parseScanned, type BandData } from "../lib/band";
import { ArrowLeftIcon, QrCodeIcon, WarningIcon, CameraIcon, EyeIcon } from "@phosphor-icons/react";

const SAMPLE: BandData = { person: "Aarav (age 4)", family: "Sunita Kale", contact: "98461 20755", alt: "97123 88410" };
const IMG = (f: string) => `${import.meta.env.BASE_URL}band/${f}`;

export function SafetyBand() {
  const { navigate } = useApp();
  const [scanning, setScanning] = useState(false);
  const [err, setErr] = useState("");

  // Start the camera ONLY while scanning is true.
  useEffect(() => {
    if (!scanning) return;
    setErr("");
    const scanner = new Html5Qrcode("band-reader");
    let handled = false;
    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 240, height: 240 } },
      (decoded) => {
        if (handled) return;
        const data = parseScanned(decoded);
        if (data) { handled = true; scanner.stop().catch(() => {}); navigate({ name: "bandScan", data }); }
        else setErr("That QR isn't a recognised safety band.");
      },
      () => { /* per-frame no-match, ignore */ },
    ).catch((e) => {
      setErr(String(e).includes("NotAllowed") || String(e?.message).includes("Permission")
        ? "Camera permission denied. Allow camera access and try again."
        : "No camera available on this device.");
    });
    return () => { scanner.stop().then(() => scanner.clear()).catch(() => {}); };
  }, [scanning, navigate]);

  return (
    <div className="max-w-2xl mx-auto px-5 py-8 anim-rise">
      <button onClick={() => navigate({ name: "home" })}
        className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink mb-4">
        <ArrowLeftIcon size={16} /> Home
      </button>

      <div className="flex items-center gap-3 mb-4">
        <span className="grid place-items-center w-12 h-12 rounded-xl bg-alert-soft text-alert">
          <QrCodeIcon size={26} weight="duotone" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
            Safety band (QR)
            <InfoDot text="Bands are pre-printed and registered separately. This screen only scans a band to reveal the family contact card — no data is entered here." />
          </h1>
          <p className="text-sm text-muted">Scan a person's safety band to reach their family instantly.</p>
        </div>
      </div>

      {!scanning ? (
        <Panel className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <BandImage name="band-1" alt="QR safety band" />
            <BandImage name="band-2" alt="Official souvenir stall with QR bands" />
          </div>

          <div className="mt-5">
            <h2 className="text-base font-bold text-ink">Who is this for?</h2>
            <p className="text-sm text-muted mt-1">
              For people who cannot give their own details — young children, elderly with dementia or
              memory loss, and other vulnerable pilgrims. Families collect a religious band (worn as a
              souvenir) carrying a small QR. If the person is found, anyone can scan it here to reach
              their family at once.
            </p>
          </div>

          <Button className="w-full mt-6" onClick={() => setScanning(true)}>
            <CameraIcon size={18} weight="bold" /> Scan QR
          </Button>

          <button onClick={() => navigate({ name: "bandScan", data: SAMPLE })}
            className="w-full mt-3 flex items-center justify-center gap-1.5 text-sm text-muted hover:text-action transition">
            <EyeIcon size={15} /> Preview a sample result
          </button>
        </Panel>
      ) : (
        <Panel className="p-4">
          <div id="band-reader" className="overflow-hidden rounded-card bg-ink/5 min-h-[260px]" />
          {err
            ? <div className="mt-3 flex items-start gap-2 text-sm text-alert bg-alert-soft rounded-[10px] p-3">
                <WarningIcon size={18} weight="fill" className="shrink-0 mt-0.5" /> {err}
              </div>
            : <p className="text-sm text-muted text-center mt-3">Hold the band steady inside the frame…</p>}
          <Button variant="ghost" className="w-full mt-3" onClick={() => setScanning(false)}>Cancel</Button>
        </Panel>
      )}
    </div>
  );
}

/* Tries <name>.jpg then <name>.png, then shows a labelled placeholder. */
function BandImage({ name, alt }: { name: string; alt: string }) {
  const candidates = [IMG(`${name}.jpg`), IMG(`${name}.png`)];
  const [idx, setIdx] = useState(0);
  return idx < candidates.length ? (
    <img src={candidates[idx]} alt={alt} onError={() => setIdx((i) => i + 1)}
      className="w-full h-44 object-cover rounded-card border border-line" />
  ) : (
    <div className="w-full h-44 grid place-items-center text-center rounded-card border border-dashed border-line-strong bg-surface-2 text-muted text-xs px-3">
      <span>Add image at<br /><code className="text-ink">public/band/{name}.jpg</code> or <code className="text-ink">.png</code></span>
    </div>
  );
}
