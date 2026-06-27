/* App-wide state: navigation, language, live pending count, and the
   in-flight intake "flow" (query → matches) shared across views. */

import {
  createContext, useContext, useState, useCallback, useEffect, type ReactNode,
} from "react";
import type { CaseRecord, IntakeMode, MatchResult } from "../types";
import { api } from "../lib/api";
import { type Lang } from "../lib/i18n";
import { bandFromHash, type BandData } from "../lib/band";

export type Route =
  | { name: "home" }
  | { name: "intake"; mode: IntakeMode }
  | { name: "results" }
  | { name: "token" }
  | { name: "escalation" }
  | { name: "search" }
  | { name: "band" }
  | { name: "bandScan"; data: BandData }
  | { name: "admin" };

function initialRoute(): Route {
  const band = bandFromHash();
  if (band) return { name: "bandScan", data: band };
  if (window.location.hash === "#admin") return { name: "admin" };
  return { name: "home" };
}

export interface FlowState {
  mode: IntakeMode;
  query: Partial<CaseRecord>;
  matches: MatchResult[];
  createdCase?: CaseRecord;
}

interface AppCtx {
  route: Route;
  navigate: (r: Route) => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  online: boolean;
  ready: boolean;
  pending: number;
  refreshPending: () => void;
  flow: FlowState | null;
  setFlow: (f: FlowState | null) => void;
}

const Ctx = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>(initialRoute);
  const [lang, setLang] = useState<Lang>("EN");
  const [online] = useState(true);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(0);
  const [flow, setFlow] = useState<FlowState | null>(null);

  const navigate = useCallback((r: Route) => {
    setRoute(r);
    window.location.hash = r.name === "admin" ? "admin" : "";
    window.scrollTo({ top: 0 });
  }, []);

  const refreshPending = useCallback(() => {
    api.getOpenCases().then((c) => setPending(c.length)).catch(() => {});
  }, []);

  useEffect(() => {
    api.init().then(() => { setReady(true); refreshPending(); }).catch((e) => console.error(e));
  }, [refreshPending]);

  // Pick up a scanned band URL even if the app is already open.
  useEffect(() => {
    const onHash = () => {
      const band = bandFromHash();
      if (band) setRoute({ name: "bandScan", data: band });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => { if (ready) refreshPending(); }, [refreshPending, route, ready]);

  // Live: keep the pending count fresh app-wide.
  useEffect(() => {
    if (!ready) return;
    const id = setInterval(refreshPending, 8000);
    return () => clearInterval(id);
  }, [ready, refreshPending]);

  return (
    <Ctx.Provider value={{ route, navigate, lang, setLang, online, ready, pending, refreshPending, flow, setFlow }}>
      {children}
    </Ctx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useApp must be used within AppProvider");
  return c;
}
