import Link from "next/link";
import { brandConfig, highIntentServiceLinks } from "@/lib/config";

export function SiteFooter() {
  return (
    <footer className="border-t border-[#c98a4a]/45 bg-[#071d32] text-white">
      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 text-sm md:grid-cols-[1fr_1fr_1fr_1fr] md:px-8">
        <div>
          <div className="font-bold text-[#e3b56e]">{brandConfig.name}</div>
          <div className="mt-1 text-white/72">{brandConfig.legalOwner}</div>
          <address className="mt-3 not-italic text-white/70">
            <div>{brandConfig.streetAddress}</div>
            <div>{brandConfig.city}, {brandConfig.state} {brandConfig.postalCode}</div>
            <a className="mt-2 block hover:text-white" href={`tel:${brandConfig.phoneHref}`}>{brandConfig.phone}</a>
            <a className="block hover:text-white" href={`mailto:${brandConfig.email}`}>{brandConfig.email}</a>
          </address>
        </div>
        <div className="grid gap-2 text-white/72">
          <Link href="/hvac-services">HVAC Services</Link>
          <Link href="/commercial-fuel-delivery-lancaster">Fuel Delivery</Link>
          <Link href="/emergency-service">Emergency Service</Link>
          <Link href="/commercial-audit">Commercial Accounts</Link>
          <Link href="/blog">Resource Center</Link>
          <Link href="/careers">Careers</Link>
        </div>
        <div className="grid gap-2 text-white/72">
          {highIntentServiceLinks.map((service) => (
            <Link href={service.href} key={service.href}>{service.label}</Link>
          ))}
        </div>
        <div>
          <p className="text-white/72">{brandConfig.disclaimer}</p>
          <Link className="mt-3 inline-block text-[#e3b56e]/85 hover:text-[#e3b56e]" href="/contractor-partner-program">
            Contractor partner application
          </Link>
        </div>
      </div>
    </footer>
  );
}
