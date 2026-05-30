"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";

/**
 * The human-in-the-loop control. The policy engine decided this needed a human;
 * here the operator records approve/reject with an optional note. Per the
 * Technical Review, autonomy progresses Human Review -> AI Recommendation ->
 * One-Click; this is the human-review stage.
 */
export function ApprovalActions({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  async function decide(decision: "approved" | "rejected") {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/approvals/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, note })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Could not record the decision.");
        setBusy(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Network error recording the decision.");
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 grid gap-2">
      <input
        className="min-h-9 rounded-md border border-[#d8d1c3] bg-white px-3 py-1.5 text-sm outline-none ring-[#0f4c45]/20 focus:ring-2"
        onChange={(e) => setNote(e.target.value)}
        placeholder="Decision note (optional)"
        value={note}
      />
      <div className="flex gap-2">
        <button
          className="inline-flex min-h-9 items-center gap-1 rounded-md bg-[#0f4c45] px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-[#0b3934] disabled:opacity-60"
          disabled={busy}
          onClick={() => decide("approved")}
          type="button"
        >
          <Check size={16} /> Approve
        </button>
        <button
          className="inline-flex min-h-9 items-center gap-1 rounded-md border border-[#c0392b] px-3 py-1.5 text-sm font-semibold text-[#8d2f20] transition hover:bg-[#f7d8d2] disabled:opacity-60"
          disabled={busy}
          onClick={() => decide("rejected")}
          type="button"
        >
          <X size={16} /> Reject
        </button>
      </div>
      {error ? <p className="text-sm font-semibold text-[#8d2f20]">{error}</p> : null}
    </div>
  );
}
