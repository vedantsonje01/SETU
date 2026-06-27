/* Shared top bar: brand · center · sync · pending · language · admin link. */

import { useApp } from "../store/app";
import { LANGS, LANG_LABEL, t } from "../lib/i18n";
import { LifebuoyIcon, GlobeHemisphereEastIcon, ClockIcon, GaugeIcon } from "@phosphor-icons/react";

const CENTER_NAME = "Center 03 — Trimbak Rd";

export function TopBar() {
  const { lang, setLang, online, pending, navigate, route } = useApp();

  const cycleLang = () => setLang(LANGS[(LANGS.indexOf(lang) + 1) % LANGS.length]);

  return (
    <header className="sticky top-0 z-50 h-14 bg-navy text-white flex items-center gap-4 px-5 shadow-md">
      <button
        onClick={() => navigate({ name: "home" })}
        className="flex items-center gap-2.5 font-bold text-lg"
      >
        <span className="grid place-items-center w-8 h-8 rounded-lg bg-white/15">
          <LifebuoyIcon size={20} weight="bold" />
        </span>
        {t("appName", lang)}
      </button>

      <span className="text-sm text-white/80 pl-3 border-l border-white/25 hidden sm:block">
        {CENTER_NAME}
      </span>

      <div className="flex-1" />

      <span className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-full bg-white/10">
        <span className={`w-2.5 h-2.5 rounded-full ${online ? "bg-system" : "bg-alert"}`}
          style={{ boxShadow: `0 0 0 3px ${online ? "rgba(21,128,61,.3)" : "rgba(220,38,38,.3)"}` }} />
        {online ? t("online", lang) : t("offline", lang)}
      </span>

      <button
        onClick={() => navigate({ name: "escalation" })}
        className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-decision/25 hover:bg-decision/40 transition"
      >
        <ClockIcon size={16} weight="bold" />
        <span className="num">{pending}</span> {t("pending", lang)}
      </button>

      <button
        onClick={() => navigate(route.name === "admin" ? { name: "home" } : { name: "admin" })}
        title="Admin / Collector view"
        className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition"
      >
        <GaugeIcon size={16} weight="bold" />
        <span className="hidden md:inline">{route.name === "admin" ? "Operator" : "Admin"}</span>
      </button>

      <button
        onClick={cycleLang}
        className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-white/10 border border-white/25 hover:bg-white/20 transition"
      >
        <GlobeHemisphereEastIcon size={16} weight="bold" />
        {LANG_LABEL[lang]}
      </button>
    </header>
  );
}
