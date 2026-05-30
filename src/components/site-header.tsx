import Link from "next/link";
import { Gauge } from "lucide-react";
import { brandConfig } from "@/lib/config";
import { ButtonLink } from "@/components/ui";

const nav = [
  ["HVAC", "/hvac-services"],
  ["Fuel Delivery", "/commercial-fuel-delivery-lancaster"],
  ["Emergency", "/emergency-service"],
  ["Commercial Accounts", "/commercial-audit"]
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#d8d1c3] bg-[#fffdf8]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 md:px-8">
        <Link className="flex min-w-0 items-center gap-3" href="/">
          <span className="grid size-10 shrink-0 place-items-center rounded-md bg-[#0f4c45] text-white">
            <Gauge size={22} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-lg font-bold">{brandConfig.name}</span>
            <span className="block truncate text-xs text-[#68706c]">{brandConfig.region}</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-semibold text-[#394340] md:flex">
          {nav.map(([label, href]) => (
            <Link className="hover:text-[#b4412a]" href={href} key={href}>
              {label}
            </Link>
          ))}
        </nav>
        <ButtonLink href="/emergency-service">Request Service</ButtonLink>
      </div>
    </header>
  );
}
