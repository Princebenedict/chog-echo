"use client";

import { useEffect } from "react";
import { hash } from "@/lib/personality";
import type { ChogToken } from "@/lib/types";

type Rgb = [number, number, number];

const VIOLET: Rgb = [135, 84, 246];
const DEFAULT_A: Rgb = [135, 84, 246];
const DEFAULT_B: Rgb = [164, 108, 255];
// Brand-safe colours used when a Chog image cannot be sampled (for example a cross-origin NFT image).
const BRAND: Rgb[] = [
  [135, 84, 246],
  [164, 108, 255],
  [85, 240, 176],
  [150, 110, 255],
  [110, 98, 255],
];

function setVars(slot: "a" | "b", rgb: Rgb) {
  const style = document.documentElement.style;
  style.setProperty(`--amb-${slot}-r`, String(Math.round(rgb[0])));
  style.setProperty(`--amb-${slot}-g`, String(Math.round(rgb[1])));
  style.setProperty(`--amb-${slot}-b`, String(Math.round(rgb[2])));
}

// Average the most colourful pixels of the artwork, then pull the result toward brand violet
// so purple stays dominant whatever the character looks like.
function dominantColor(src: string): Promise<Rgb | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const size = 24;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;

        let r = 0;
        let g = 0;
        let b = 0;
        let total = 0;
        for (let i = 0; i < data.length; i += 4) {
          const pr = data[i];
          const pg = data[i + 1];
          const pb = data[i + 2];
          const max = Math.max(pr, pg, pb);
          const min = Math.min(pr, pg, pb);
          const light = (max + min) / 510;
          if (light < 0.18 || light > 0.9) continue;
          const sat = (max - min) / 255;
          const weight = sat * sat + 0.02;
          r += pr * weight;
          g += pg * weight;
          b += pb * weight;
          total += weight;
        }
        if (total === 0) return resolve(null);
        const avg: Rgb = [r / total, g / total, b / total];
        resolve([avg[0] * 0.55 + VIOLET[0] * 0.45, avg[1] * 0.55 + VIOLET[1] * 0.45, avg[2] * 0.55 + VIOLET[2] * 0.45]);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export function resetAmbient() {
  setVars("a", DEFAULT_A);
  setVars("b", DEFAULT_B);
}

// Lets the page glow reflect the Chog (or the two Chogs in a battle) currently on screen.
export function useAmbient(tokens: (ChogToken | null | undefined)[]) {
  const key = tokens.map((t) => (t ? `${t.tokenId}|${t.image ?? ""}` : "-")).join("~");

  useEffect(() => {
    let cancelled = false;
    tokens.slice(0, 2).forEach(async (token, i) => {
      if (!token) return;
      const slot = i === 0 ? "a" : "b";
      const fallback = BRAND[hash(JSON.stringify(token.traits)) % BRAND.length];
      const sampled = token.image ? await dominantColor(token.image) : null;
      if (!cancelled) setVars(slot, sampled ?? fallback);
    });
    return () => {
      cancelled = true;
    };
    // `key` captures everything about `tokens` that matters here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => () => resetAmbient(), []);
}
