import Link from "next/link";
import Image from "next/image";
import { PhoneCall } from "lucide-react";
import { brandConfig } from "@/lib/config";
import { ButtonLink } from "@/components/ui";

const nav = [
  ["HVAC", "/hvac-services"],
  ["Fuel Delivery", "/commercial-fuel-delivery-lancaster"],
  ["Emergency", "/emergency-service"],
  ["Commercial Accounts", "/commercial-audit"],
  ["Resources", "/blog"],
  ["Careers", "/careers"]
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#c98a4a]/40 bg-[#071d32]/95 text-white shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-3 md:gap-5 md:px-8 md:py-4">
        <Link className="flex min-w-0 items-center gap-3 md:gap-4" href="/">
          <Image
            alt="Conquistador Oil logo"
            className="h-14 w-14 shrink-0 rounded-lg bg-[#08263d] object-contain p-1 shadow-md ring-1 ring-[#c98a4a]/45 md:h-[72px] md:w-[72px]"
            height={72}
            src="/brand/conquistador-oil-logo.png"
            width={72}
          />
          <span className="min-w-0">
            <span className="block truncate text-lg font-bold tracking-wide md:text-xl">{brandConfig.name}</span>
            <span className="block truncate text-xs font-semibold uppercase tracking-wide text-[#e3b56e]">{brandConfig.region}</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-semibold text-white/82 md:flex">
          {nav.map(([label, href]) => (
            <Link className="hover:text-[#e3b56e]" href={href} key={href}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <a
            className="hidden min-h-11 items-center justify-center gap-2 rounded-md bg-[#d6a354] px-4 py-3 text-sm font-bold text-[#101827] shadow-sm transition hover:bg-[#bd8736] lg:inline-flex"
            href={`tel:${brandConfig.phoneHref}`}
          >
            <PhoneCall size={17} />
            Call {brandConfig.phone}
          </a>
          <ButtonLink href="/emergency-service">Request Service</ButtonLink>
        </div>
      </div>
    </header>
  );
}
