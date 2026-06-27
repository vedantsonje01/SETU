import { useApp } from "./store/app";
import { TopBar } from "./components/TopBar";
import { Home } from "./views/Home";
import { Intake } from "./views/Intake";
import { Results } from "./views/Results";
import { TokenLookup } from "./views/TokenLookup";
import { Escalation } from "./views/Escalation";
import { SmartSearch } from "./views/SmartSearch";
import { SafetyBand } from "./views/SafetyBand";
import { BandScan } from "./views/BandScan";
import { Admin } from "./views/Admin";

export default function App() {
  const { route, ready } = useApp();
  // A scanned safety band must show instantly, without waiting for the registry.
  if (route.name === "bandScan") {
    return (
      <div className="min-h-full">
        <TopBar />
        <main><BandScan data={route.data} /></main>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <TopBar />
      {!ready ? (
        <div className="grid place-items-center py-32 text-muted">
          <div className="flex items-center gap-3">
            <span className="inline-block w-6 h-6 border-2 border-line-strong border-t-action rounded-full animate-spin" />
            Loading registry (2,500 records)…
          </div>
        </div>
      ) : (
      <main>
        {route.name === "home" && <Home />}
        {route.name === "intake" && <Intake mode={route.mode} />}
        {route.name === "results" && <Results />}
        {route.name === "token" && <TokenLookup />}
        {route.name === "escalation" && <Escalation />}
        {route.name === "search" && <SmartSearch />}
        {route.name === "band" && <SafetyBand />}
        {route.name === "admin" && <Admin />}
      </main>
      )}
      <footer className="mt-10 border-t border-line py-4 text-center text-xs text-muted px-5">
        Prototype on synthetic data (no real personal information). Matching is decision support and must be confirmed by an operator. Privacy by design: name optional, status shared only via token.
      </footer>
    </div>
  );
}
