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
    const key = `co_seen_${experimentId}_${variantId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    navigator.sendBeacon(
      "/api/experiments/impression",
      new Blob([JSON.stringify({ experimentId, variantId, page })], {
        type: "application/json"
      })
    );
  }, [experimentId, page, variantId]);

  useEffect(() => {
    const cookieVariant = readCookie("co_home_hero_variant");
    if (!cookieVariant) return;
    document.documentElement.dataset.homeHeroVariant = cookieVariant;
  }, []);

  return null;
}
