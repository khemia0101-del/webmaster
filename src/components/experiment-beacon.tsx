"use client";

import { useEffect } from "react";

function readCookie(name: string) {
  return document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${name}=`))
    ?.split("=")[1];
}

export function ExperimentBeacon({
  experimentId,
  variantId,
  page
}: {
  experimentId: string;
  variantId: string;
  page: string;
}) {
  useEffect(() => {
    const assignedVariant = readCookie("co_home_hero_variant") || variantId;
    const key = `co_seen_${experimentId}_${assignedVariant}_${Math.floor(Date.now() / 1_800_000)}`;
    try { if (sessionStorage.getItem(key)) return; } catch { /* Storage can be disabled. */ }
    void fetch("/api/experiments/impression", {
      method: "POST", keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ experimentId, variantId: assignedVariant, page })
    }).then((response) => {
      if (response.ok) { try { sessionStorage.setItem(key, "1"); } catch { /* Server deduplicates. */ } }
    }).catch(() => undefined);
  }, [experimentId, page, variantId]);

  useEffect(() => {
    const cookieVariant = readCookie("co_home_hero_variant");
    if (!cookieVariant) return;
    document.documentElement.dataset.homeHeroVariant = cookieVariant;
  }, []);

  return null;
}
