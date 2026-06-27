/* #5 — Disclaimer / info affordance. Small "i" with an accessible tooltip
   (hover + keyboard focus). Use liberally next to scores, metrics, actions. */

import { InfoIcon } from "@phosphor-icons/react";

export function InfoDot({ text, side = "top" }: { text: string; side?: "top" | "left" }) {
  const pos = side === "left"
    ? "right-full mr-2 top-1/2 -translate-y-1/2"
    : "left-1/2 -translate-x-1/2 bottom-full mb-1.5";
  return (
    <span className="relative inline-flex group align-middle">
      <button
        type="button"
        aria-label={text}
        className="text-faint hover:text-action focus-visible:text-action transition leading-none"
      >
        <InfoIcon size={15} weight="bold" />
      </button>
      <span
        role="tooltip"
        className={`pointer-events-none absolute ${pos} z-[60] w-60 rounded-lg bg-ink text-white
          text-xs leading-snug px-3 py-2 shadow-lg opacity-0 translate-y-0.5
          group-hover:opacity-100 group-focus-within:opacity-100 transition`}
      >
        {text}
      </span>
    </span>
  );
}
