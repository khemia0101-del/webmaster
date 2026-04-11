"use client";

import { useState } from "react";

export function ChatInput({ onSend, disabled }: { onSend: (value: string) => Promise<void>; disabled?: boolean }) {
  const [value, setValue] = useState("");

  return (
    <form
      className="flex gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!value.trim()) return;
        const sending = value;
        setValue("");
        await onSend(sending);
      }}
    >
      <input
        className="flex-1 rounded border px-3 py-2"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type your answer..."
        disabled={disabled}
      />
      <button className="rounded bg-blue-600 px-3 py-2 text-white" disabled={disabled}>
        Send
      </button>
    </form>
  );
}
