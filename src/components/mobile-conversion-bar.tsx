import { PhoneCall, Wrench } from "lucide-react";
import { brandConfig } from "@/lib/config";

export function MobileConversionBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#c98a4a]/45 bg-[#071d32] p-3 shadow-2xl md:hidden">
      <div className="grid grid-cols-2 gap-3">
        <a
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#d6a354] px-3 py-2 text-sm font-bold text-[#101827]"
          href={`tel:${brandConfig.phoneHref}`}
        >
          <PhoneCall size={18} />
          Call Now
        </a>
        <a
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#b86a32] px-3 py-2 text-sm font-bold text-white"
          href="/emergency-service"
        >
          <Wrench size={18} />
          Request Service
        </a>
      </div>
    </div>
  );
}
