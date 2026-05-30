"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Field, TextArea } from "@/components/ui";
import type { LeadType } from "@/lib/types";

type FieldConfig = {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  area?: boolean;
  placeholder?: string;
};

export function IntakeForm({
  type,
  fields,
  submitLabel = "Submit request"
}: {
  type: LeadType;
  fields: FieldConfig[];
  submitLabel?: string;
}) {
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  function readCookie(name: string) {
    return document.cookie
      .split("; ")
      .find((part) => part.startsWith(`${name}=`))
      ?.split("=")[1];
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    const form = new FormData(event.currentTarget);
    form.set("fallbackType", type);
    form.set("experimentId", "home-hero-v1");
    form.set("variantId", readCookie("co_home_hero_variant") || "service-first");
    const response = await fetch("/api/intake", { method: "POST", body: form });
    const body = await response.json();
    if (!response.ok) {
      setStatus("error");
      setMessage(body.error || "The intake could not be saved.");
      return;
    }
    setStatus("done");
    setMessage(body.message);
    event.currentTarget.reset();
  }

  return (
    <form className="grid gap-4 rounded-lg border border-[#d8d1c3] bg-[#fffdf8] p-5 shadow-sm" onSubmit={onSubmit}>
      <input name="source" type="hidden" value="Website" />
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) =>
          field.area ? (
            <div className="md:col-span-2" key={field.name}>
              <TextArea {...field} />
            </div>
          ) : (
            <Field {...field} key={field.name} />
          )
        )}
      </div>
      <button
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#0f4c45] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0b3934] disabled:opacity-60"
        disabled={status === "submitting"}
        type="submit"
      >
        {status === "submitting" ? "Sending..." : submitLabel}
        {status === "done" ? <CheckCircle2 size={18} /> : <ArrowRight size={18} />}
      </button>
      {message ? (
        <p className={status === "error" ? "text-sm font-semibold text-[#8d2f20]" : "text-sm font-semibold text-[#0f4c45]"}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
