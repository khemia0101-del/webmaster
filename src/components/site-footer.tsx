import Link from "next/link";
import { brandConfig } from "@/lib/config";

export function SiteFooter() {
  return (
    <footer className="border-t border-[#d8d1c3] bg-[#1d2525] text-white">
      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 text-sm md:grid-cols-[1fr_1fr_1fr] md:px-8">
        <div>
          <div className="font-bold">{brandConfig.name}</div>
          <div className="mt-1 text-white/70">{brandConfig.legalOwner}</div>
          <div className="mt-3 text-white/70">{brandConfig.baseCity}</div>
        </div>
        <div className="grid gap-2 text-white/70">
          <Link href="/hvac-services">HVAC Services</Link>
          <Link href="/commercial-fuel-delivery-lancaster">Fuel Delivery</Link>
          <Link href="/emergency-service">Emergency Service</Link>
          <Link href="/commercial-audit">Commercial Accounts</Link>
        </div>
        <div>
          <p className="text-white/70">{brandConfig.disclaimer}</p>
          <Link className="mt-3 inline-block text-white/50 hover:text-white" href="/contractor-partner-program">
            Contractor partner application
          </Link>
        </div>
      </div>
    </footer>
  );
}
