/* What a finder sees after scanning a safety band's QR.
   Four things: person, family member, contact, alternate contact. */

import type { ReactNode } from "react";
import { useApp } from "../store/app";
import { Button, Panel } from "../components/ui";
import type { BandData } from "../lib/band";
import { ShieldCheckIcon, PhoneIcon, UserIcon, UsersThreeIcon } from "@phosphor-icons/react";

export function BandScan({ data }: { data: BandData }) {
  const { navigate } = useApp();

  return (
    <div className="max-w-md mx-auto px-5 py-10 anim-rise">
      <Panel className="overflow-hidden">
        <div className="bg-navy text-white p-5 text-center">
          <ShieldCheckIcon size={36} weight="fill" className="mx-auto mb-1" />
          <h1 className="text-lg font-bold">Kumbh Setu safety band</h1>
          <p className="text-sm text-white/85">This person may be lost. Please help reunite them or take them to the nearest help center.</p>
        </div>

        <div className="p-5 space-y-3">
          <Row icon={<UserIcon size={18} />} label="Missing person" value={data.person} big />
          <Row icon={<UsersThreeIcon size={18} />} label="Family member" value={data.family} />

          <a href={`tel:${data.contact}`}
            className="flex items-center justify-between gap-3 rounded-[10px] bg-system-soft text-system p-3 font-semibold">
            <span className="flex items-center gap-2"><PhoneIcon size={18} weight="fill" /> Call family</span>
            <span className="num">{data.contact}</span>
          </a>

          {data.alt && (
            <a href={`tel:${data.alt}`}
              className="flex items-center justify-between gap-3 rounded-[10px] border border-line p-3 text-ink">
              <span className="flex items-center gap-2 text-muted"><PhoneIcon size={18} /> Alternate contact</span>
              <span className="num font-semibold">{data.alt}</span>
            </a>
          )}
        </div>

        <div className="px-5 pb-5">
          <Button variant="ghost" className="w-full" onClick={() => navigate({ name: "home" })}>
            Open Kumbh Setu
          </Button>
          <p className="text-center text-xs text-muted mt-3">
            Shared only to help reunification. Please respect this family's privacy.
          </p>
        </div>
      </Panel>
    </div>
  );
}

function Row({ icon, label, value, big }: { icon: ReactNode; label: string; value: string; big?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-faint mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-muted uppercase tracking-wide">{label}</p>
        <p className={`font-semibold text-ink ${big ? "text-xl" : ""}`}>{value}</p>
      </div>
    </div>
  );
}
