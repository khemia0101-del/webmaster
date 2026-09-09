"use client";

import { useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";

export function LeadChatWidget() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const element = event.currentTarget;
    setStatus("sending");
    setMessage("");
    const form = new FormData(element);
    const payload = Object.fromEntries(Array.from(form.entries()).map(([key, value]) => [key, String(value)]));
    try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus("error");
      setMessage(body.error || "The message could not be saved.");
      return;
    }
    setStatus("sent");
    setMessage(body.message || "Message received.");
    element.reset();
    } catch {
      setStatus("error");
      setMessage("We could not confirm receipt. Please call (717) 397-9800 before resubmitting.");
    }
  }

  return (
    <div className="fixed bottom-24 right-5 z-50 md:bottom-5">
      {open ? (
        <div className="w-[min(92vw,380px)] rounded-lg border border-[#d8c2a6] bg-[#fff9ee] shadow-2xl">
          <div className="flex items-center justify-between rounded-t-lg bg-[#071d32] px-4 py-3 text-white">
            <div>
              <div className="font-bold">Conquistador Oil</div>
              <div className="text-xs text-white/80">Revenue Desk intake</div>
            </div>
            <button aria-label="Close chat" className="rounded p-1 hover:bg-white/10" onClick={() => setOpen(false)} type="button">
              <X size={18} />
            </button>
          </div>
          <form className="grid gap-3 p-4 text-sm" onSubmit={submit}>
            <div hidden aria-hidden="true"><label>Leave blank<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
            <input className="min-h-10 rounded-md border border-[#d8c2a6] px-3 outline-none ring-[#b86a32]/25 focus:ring-4" name="name" placeholder="Name" />
            <div className="grid gap-3 md:grid-cols-2">
              <input className="min-h-10 rounded-md border border-[#d8c2a6] px-3 outline-none ring-[#b86a32]/25 focus:ring-4" name="email" placeholder="Email" type="email" />
              <input className="min-h-10 rounded-md border border-[#d8c2a6] px-3 outline-none ring-[#b86a32]/25 focus:ring-4" name="phone" placeholder="Phone" />
            </div>
            <input className="min-h-10 rounded-md border border-[#d8c2a6] px-3 outline-none ring-[#b86a32]/25 focus:ring-4" name="serviceType" placeholder="Service type" />
            <div className="grid gap-3 md:grid-cols-2">
              <input className="min-h-10 rounded-md border border-[#d8c2a6] px-3 outline-none ring-[#b86a32]/25 focus:ring-4" name="zone" placeholder="Town / area" />
              <input className="min-h-10 rounded-md border border-[#d8c2a6] px-3 outline-none ring-[#b86a32]/25 focus:ring-4" name="urgency" placeholder="Urgency" />
            </div>
            <textarea
              className="min-h-24 rounded-md border border-[#d8c2a6] px-3 py-2 outline-none ring-[#b86a32]/25 focus:ring-4"
              name="question"
              placeholder="How can we help?"
              required
            />
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#b86a32] px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-[#935126] disabled:opacity-60"
              disabled={status === "sending"}
              type="submit"
            >
              {status === "sending" ? "Sending..." : "Send message"}
              <Send size={16} />
            </button>
            {message ? (
              <p className={status === "error" ? "text-[#8d2f20]" : "text-[#0b2f4a]"}>{message}</p>
            ) : null}
          </form>
        </div>
      ) : (
        <button
          aria-label="Open Conquistador Oil chat"
          className="inline-flex size-14 items-center justify-center rounded-full bg-[#b86a32] text-white shadow-xl ring-2 ring-[#e3b56e]/35 transition hover:bg-[#935126]"
          onClick={() => setOpen(true)}
          type="button"
        >
          <MessageCircle size={24} />
        </button>
      )}
    </div>
  );
}
