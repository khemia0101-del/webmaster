"use client";

import { useState } from "react";

type Msg = { role: "assistant" | "user"; content: string };

export function useChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [websiteId, setWebsiteId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  async function startSession() {
    setIsLoading(true);
    const res = await fetch("/api/chat/start", { method: "POST" });
    const data = await res.json();
    setSessionId(data.sessionId);
    setWebsiteId(data.websiteId);
    setMessages([{ role: "assistant", content: data.welcomeMessage }]);
    setCurrentStep(1);
    setIsLoading(false);
  }

  async function sendMessage(content: string) {
    if (!sessionId) return;
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: "user", content }]);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, message: content })
    });
    const data = await res.json();

    setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    setCurrentStep(data.currentStep);
    setIsLoading(false);
  }

  return { messages, sessionId, websiteId, currentStep, isLoading, startSession, sendMessage };
}
