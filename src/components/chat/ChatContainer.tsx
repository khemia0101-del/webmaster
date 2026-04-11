"use client";

import { useEffect } from "react";
import { useChat } from "@/hooks/useChat";
import { ChatInput } from "./ChatInput";
import { ChatMessage } from "./ChatMessage";

export function ChatContainer() {
  const { messages, currentStep, isLoading, startSession, sendMessage } = useChat();

  useEffect(() => {
    void startSession();
  }, []);

  return (
    <section className="flex h-screen flex-col border-r p-4">
      <div className="mb-3 text-sm font-medium text-gray-600">Step {currentStep} of 7</div>
      <div className="mb-4 flex-1 overflow-y-auto">
        {messages.map((m, i) => (
          <ChatMessage key={`${m.role}-${i}`} role={m.role} content={m.content} />
        ))}
      </div>
      <ChatInput onSend={sendMessage} disabled={isLoading} />
    </section>
  );
}
