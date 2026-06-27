/* Section 1 — Home Fork: "Who are you helping?" */

import { useApp } from "../store/app";
import { t } from "../lib/i18n";
import {
  UserFocusIcon, UsersThreeIcon, HashIcon, ListChecksIcon, CaretRightIcon, SparkleIcon, QrCodeIcon,
} from "@phosphor-icons/react";
import type { Route } from "../store/app";
import type { ReactNode } from "react";

interface Choice {
  route: Route;
  icon: ReactNode;
  titleKey: "found" | "family" | "tokenLookup" | "dashboard" | "smartSearch" | "band";
  subKey: "foundSub" | "familySub" | "tokenSub" | "dashboardSub" | "smartSearchSub" | "bandSub";
  accent: string;
}

export function Home() {
  const { navigate, lang } = useApp();

  const choices: Choice[] = [
    { route: { name: "intake", mode: "found" }, icon: <UserFocusIcon size={30} weight="duotone" />, titleKey: "found", subKey: "foundSub", accent: "text-action bg-action-soft" },
    { route: { name: "intake", mode: "family" }, icon: <UsersThreeIcon size={30} weight="duotone" />, titleKey: "family", subKey: "familySub", accent: "text-navy bg-navy-soft" },
    { route: { name: "token" }, icon: <HashIcon size={30} weight="duotone" />, titleKey: "tokenLookup", subKey: "tokenSub", accent: "text-decision bg-decision-soft" },
    { route: { name: "escalation" }, icon: <ListChecksIcon size={30} weight="duotone" />, titleKey: "dashboard", subKey: "dashboardSub", accent: "text-system bg-system-soft" },
    { route: { name: "search" }, icon: <SparkleIcon size={30} weight="duotone" />, titleKey: "smartSearch", subKey: "smartSearchSub", accent: "text-action bg-action-soft" },
    { route: { name: "band" }, icon: <QrCodeIcon size={30} weight="duotone" />, titleKey: "band", subKey: "bandSub", accent: "text-alert bg-alert-soft" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-5 py-10 anim-rise">
      <h1 className="text-3xl font-bold text-ink">{t("who", lang)}</h1>
      <p className="mt-2 text-muted">Pick the situation. Everything is entered here at the center.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {choices.map((c) => (
          <button
            key={c.titleKey}
            onClick={() => navigate(c.route)}
            className="group text-left bg-surface border border-line rounded-card p-6
              shadow-sm hover:shadow-md hover:border-action transition flex items-start gap-4
              active:translate-y-px"
          >
            <span className={`shrink-0 grid place-items-center w-14 h-14 rounded-xl ${c.accent}`}>
              {c.icon}
            </span>
            <span className="flex-1">
              <span className="flex items-center justify-between">
                <span className="text-lg font-bold text-ink">{t(c.titleKey, lang)}</span>
                <CaretRightIcon size={20} className="text-faint group-hover:text-action transition" />
              </span>
              <span className="block mt-1 text-sm text-muted">{t(c.subKey, lang)}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
