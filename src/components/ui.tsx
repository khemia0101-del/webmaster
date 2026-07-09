import Link from "next/link";
import { clsx } from "clsx";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

export function ButtonLink({
  href,
  children,
  variant = "primary"
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
}) {
  return (
    <Link
      className={clsx(
        "inline-flex min-h-11 items-center justify-center rounded-md px-5 py-3 text-sm font-semibold shadow-sm transition",
        variant === "primary" && "bg-[#b86a32] text-white hover:bg-[#935126]",
        variant === "secondary" && "bg-[#d6a354] text-[#101827] hover:bg-[#bd8736]",
        variant === "ghost" && "border border-[#d8c2a6] bg-[#fff9ee]/85 text-[#101827] hover:bg-white"
      )}
      href={href}
    >
      {children}
    </Link>
  );
}

export function Section({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<"section">) {
  return <section className={clsx("mx-auto w-full max-w-7xl px-5 py-12 md:px-8", className)} {...props}>{children}</section>;
}

export function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-l-4 border-[#d6a354] bg-white/75 p-4">
      <div className="text-2xl font-bold text-[#0b2f4a]">{value}</div>
      <div className="mt-1 text-sm text-[#5c6570]">{label}</div>
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "warn" | "bad" }) {
  return (
    <span
      className={clsx(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        tone === "neutral" && "bg-[#eadcc8] text-[#101827]",
        tone === "good" && "bg-[#dcecf1] text-[#0b2f4a]",
        tone === "warn" && "bg-[#fff1c7] text-[#6c4a00]",
        tone === "bad" && "bg-[#f7d8d2] text-[#8d2f20]"
      )}
    >
      {children}
    </span>
  );
}

export function Field({
  label,
  name,
  type = "text",
  required = false,
  placeholder
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#101827]">
      {label}
      <input
        className="min-h-11 rounded-md border border-[#d8c2a6] bg-white px-3 py-2 text-base font-normal outline-none ring-[#b86a32]/25 focus:ring-4"
        name={name}
        placeholder={placeholder}
        required={required}
        type={type}
      />
    </label>
  );
}

export function TextArea({
  label,
  name,
  required = false,
  placeholder
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#101827]">
      {label}
      <textarea
        className="min-h-28 rounded-md border border-[#d8c2a6] bg-white px-3 py-2 text-base font-normal outline-none ring-[#b86a32]/25 focus:ring-4"
        name={name}
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
}
