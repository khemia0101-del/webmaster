"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Menu, PhoneCall, X } from "lucide-react";
import { brandConfig } from "@/lib/config";

const navGroups = [
  {
    label: "Heating & HVAC",
    href: "/hvac-services",
    items: [
      {
        label: "HVAC Services",
        href: "/hvac-services",
        description: "Heating, cooling, repair, and installation requests"
      },
      {
        label: "Emergency Heating",
        href: "/emergency-heating-service-lancaster-pa",
        description: "Urgent no-heat and heating service help"
      },
      {
        label: "Furnace Repair",
        href: "/furnace-repair-lancaster-pa",
        description: "Furnace and oil-burner service requests"
      },
      {
        label: "Boiler Repair",
        href: "/boiler-repair-lancaster-pa",
        description: "Boiler troubleshooting and repair requests"
      }
    ]
  },
  {
    label: "Fuel Delivery",
    href: "/heating-oil-delivery-lancaster-pa",
    items: [
      {
        label: "Heating Oil Delivery",
        href: "/heating-oil-delivery-lancaster-pa",
        description: "Residential and commercial heating oil requests"
      },
      {
        label: "Commercial Fuel",
        href: "/commercial-fuel-delivery-lancaster",
        description: "Fuel support for local operations"
      },
      {
        label: "Off-Road Diesel",
        href: "/off-road-diesel",
        description: "Fuel for equipment, farms, and work sites"
      },
      {
        label: "Job-Site Fuel",
        href: "/job-site-fuel",
        description: "Delivery requests for active project sites"
      }
    ]
  },
  {
    label: "Commercial",
    href: "/commercial-audit",
    items: [
      {
        label: "Commercial Accounts",
        href: "/commercial-audit",
        description: "Fuel and HVAC account review for your business"
      },
      {
        label: "Property Managers",
        href: "/property-manager-vendor-desk",
        description: "Coordinated support across managed properties"
      },
      {
        label: "Farm Fuel & Heating",
        href: "/farm-fuel-heating",
        description: "Heating oil and diesel support for farms"
      },
      {
        label: "Request a Fuel Quote",
        href: "/commercial-quote",
        description: "Share your volume, timing, and site details"
      }
    ]
  },
  {
    label: "Resources",
    href: "/blog",
    items: [
      {
        label: "Resource Center",
        href: "/blog",
        description: "Practical guidance on fuel, heating, and HVAC"
      },
      {
        label: "Service Areas",
        href: "/service-areas",
        description: "See where service requests are supported"
      },
      {
        label: "Careers",
        href: "/careers",
        description: "Explore local driver and HVAC opportunities"
      },
      {
        label: "Contractor Partners",
        href: "/contractor-partner-program",
        description: "Apply to join the service partner network"
      }
    ]
  }
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.18, ease: [0.22, 1, 0.36, 1] as const };

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveMenu(null);
        setMobileOpen(false);
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  function closeNavigation() {
    setActiveMenu(null);
    setMobileOpen(false);
  }

  return (
    <header className="sticky top-0 z-[80] border-b border-[#b86a32]/45 bg-[#061a2c] text-white shadow-[0_10px_28px_rgba(2,12,22,0.24)]">
      <div className="relative mx-auto flex h-[76px] max-w-7xl items-center gap-4 px-4 sm:px-6 md:px-8">
        <Link
          aria-label={`${brandConfig.name} home`}
          className="flex min-w-0 shrink-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e3b56e] focus-visible:ring-offset-4 focus-visible:ring-offset-[#061a2c]"
          href="/"
          onClick={closeNavigation}
        >
          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-[#d6a354]/55 bg-[#08263d] shadow-[0_6px_16px_rgba(0,0,0,0.26)] sm:h-14 sm:w-14">
            <Image
              alt=""
              aria-hidden="true"
              className="object-contain"
              fill
              priority
              sizes="56px"
              src="/brand/conquistador-oil-logo.png"
            />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-bold tracking-[-0.01em] text-white sm:text-xl">
              {brandConfig.name}
            </span>
            <span className="hidden max-w-[220px] truncate text-[10px] font-bold uppercase tracking-[0.12em] text-[#e3b56e] sm:block">
              {brandConfig.region}
            </span>
          </span>
        </Link>

        <nav aria-label="Primary navigation" className="ml-auto hidden h-full items-stretch xl:flex">
          {navGroups.map((group) => {
            const isOpen = activeMenu === group.label;
            const isCurrent =
              pathname === group.href || group.items.some((item) => pathname === item.href);

            return (
              <div
                className="relative flex items-stretch"
                key={group.label}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    setActiveMenu(null);
                  }
                }}
                onMouseEnter={() => setActiveMenu(group.label)}
                onMouseLeave={() => setActiveMenu(null)}
              >
                <button
                  aria-controls={`desktop-menu-${group.label.replaceAll(" ", "-").toLowerCase()}`}
                  aria-expanded={isOpen}
                  className="relative flex items-center gap-1.5 px-3 text-[13px] font-bold text-[#d7e1e8] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#e3b56e]"
                  onClick={() => setActiveMenu(isOpen ? null : group.label)}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      setActiveMenu(group.label);
                    }
                  }}
                  type="button"
                >
                  {group.label}
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    aria-hidden="true"
                    className="flex text-[#d6a354]"
                    transition={menuTransition}
                  >
                    <ChevronDown size={14} />
                  </motion.span>
                  {(isOpen || isCurrent) && (
                    <motion.span
                      className="absolute inset-x-3 bottom-0 h-0.5 bg-[#d6a354]"
                      layoutId="desktop-nav-indicator"
                      transition={menuTransition}
                    />
                  )}
                </button>

                <div className="pointer-events-none absolute left-1/2 top-full w-[22rem] -translate-x-1/2">
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                        className="pointer-events-auto pt-3"
                        exit={{ opacity: 0, y: -6, scale: 0.985, filter: "blur(4px)" }}
                        id={`desktop-menu-${group.label.replaceAll(" ", "-").toLowerCase()}`}
                        initial={
                          prefersReducedMotion
                            ? false
                            : { opacity: 0, y: -8, scale: 0.98, filter: "blur(6px)" }
                        }
                        transition={menuTransition}
                      >
                        <div className="overflow-hidden rounded-2xl border border-[#d6a354]/30 bg-[#0a263d] p-2 shadow-[0_22px_55px_rgba(0,0,0,0.42)]">
                          <Link
                            className="flex items-center justify-between rounded-xl bg-[#071d32] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#103650] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e3b56e]"
                            href={group.href}
                            onClick={closeNavigation}
                          >
                            Explore {group.label}
                            <span aria-hidden="true" className="text-[#e3b56e]">→</span>
                          </Link>
                          <div className="mt-1">
                            {group.items.map((item) => (
                              <Link
                                className="group/item block rounded-xl px-4 py-3 transition-colors hover:bg-white/[0.07] focus-visible:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#e3b56e]"
                                href={item.href}
                                key={item.href}
                                onClick={closeNavigation}
                              >
                                <span className="block text-sm font-bold text-[#f7f1e8] transition-colors group-hover/item:text-white">
                                  {item.label}
                                </span>
                                <span className="mt-0.5 block text-xs leading-5 text-[#b9c7d1]">
                                  {item.description}
                                </span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 xl:ml-2">
          <a
            aria-label={`Call Conquistador Oil at ${brandConfig.phone}`}
            className="hidden min-h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.04] px-4 text-sm font-bold text-white transition-colors hover:border-[#d6a354]/70 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e3b56e] lg:inline-flex"
            href={`tel:${brandConfig.phoneHref}`}
          >
            <PhoneCall aria-hidden="true" className="text-[#e3b56e]" size={16} />
            {brandConfig.phone}
          </a>
          <Link
            className="hidden min-h-11 items-center justify-center rounded-xl bg-[#a8552a] px-4 text-sm font-bold text-white shadow-[0_7px_18px_rgba(0,0,0,0.22)] transition-colors hover:bg-[#914721] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e3b56e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#061a2c] sm:inline-flex"
            href="/emergency-service"
            onClick={closeNavigation}
          >
            Request Service
          </Link>

          <button
            aria-controls="mobile-navigation"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/[0.04] text-white transition-colors hover:border-[#d6a354]/70 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e3b56e] xl:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            type="button"
          >
            <AnimatePresence initial={false} mode="wait">
              <motion.span
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                className="flex"
                exit={{ opacity: 0, rotate: mobileOpen ? -45 : 45, scale: 0.8 }}
                initial={{ opacity: 0, rotate: mobileOpen ? 45 : -45, scale: 0.8 }}
                key={mobileOpen ? "close" : "menu"}
                transition={menuTransition}
              >
                {mobileOpen ? <X aria-hidden="true" size={21} /> : <Menu aria-hidden="true" size={21} />}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              animate={{ opacity: 1 }}
              aria-label="Dismiss navigation menu"
              className="fixed inset-0 top-[76px] z-40 cursor-default bg-[#020b12]/65 xl:hidden"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              transition={menuTransition}
              type="button"
            />
            <motion.div
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              className="absolute inset-x-3 top-[calc(100%+0.75rem)] z-50 max-h-[calc(100vh-6.5rem)] overflow-y-auto rounded-2xl border border-[#d6a354]/30 bg-[#071d32] p-4 shadow-[0_24px_65px_rgba(0,0,0,0.48)] sm:inset-x-6 xl:hidden"
              exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
              id="mobile-navigation"
              initial={
                prefersReducedMotion ? false : { opacity: 0, y: -12, filter: "blur(6px)" }
              }
              transition={menuTransition}
            >
              <nav aria-label="Mobile navigation" className="grid sm:grid-cols-2 sm:gap-x-8">
                {navGroups.map((group) => (
                  <section className="border-b border-white/10 py-3" key={group.label}>
                    <Link
                      className="flex min-h-10 items-center justify-between rounded-lg px-2 text-sm font-extrabold text-white hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e3b56e]"
                      href={group.href}
                      onClick={closeNavigation}
                    >
                      {group.label}
                      <span aria-hidden="true" className="text-[#e3b56e]">→</span>
                    </Link>
                    <div className="mt-1 grid">
                      {group.items.map((item) => (
                        <Link
                          className="rounded-lg px-2 py-2 text-sm font-semibold text-[#c1cdd6] transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e3b56e]"
                          href={item.href}
                          key={item.href}
                          onClick={closeNavigation}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </section>
                ))}
              </nav>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <a
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.05] px-3 text-sm font-bold text-white hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e3b56e]"
                  href={`tel:${brandConfig.phoneHref}`}
                >
                  <PhoneCall aria-hidden="true" size={16} />
                  Call Now
                </a>
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#a8552a] px-3 text-sm font-bold text-white hover:bg-[#914721] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e3b56e]"
                  href="/emergency-service"
                  onClick={closeNavigation}
                >
                  Request Service
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
