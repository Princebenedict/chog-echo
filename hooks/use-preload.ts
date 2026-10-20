"use client";

import { useEffect, useState } from "react";
import type { ChogToken } from "@/lib/types";

const keep = new Set<HTMLImageElement>();

// Loads and decodes an image ahead of time so swapping to it never shows an empty frame.
export function decodeImage(src: string, timeoutMs = 700): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    keep.add(img);
    const done = () => {
      window.clearTimeout(timer);
      resolve();
    };
    const timer = window.setTimeout(done, timeoutMs);
    img.onload = () => (img.decode ? img.decode().then(done, done) : done());
    img.onerror = done;
    img.src = src;
  });
}

export function heroSrc(token: ChogToken | null): string | null {
  if (!token) return "/chog/main-cutout.png";
  if (token.tokenId === "sample-a") return "/chog/main-cutout.png";
  return token.image;
}

export function usePreloadTokens(tokens: ChogToken[]) {
  const key = tokens.map((t) => t.tokenId).join("|");
  useEffect(() => {
    tokens.slice(0, 24).forEach((t) => {
      const src = heroSrc(t);
      if (src) void decodeImage(src, 4000);
    });
    // `key` stands for the token list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

// Returns the token only after its picture is ready, so the previous one never disappears early.
export function useReadyToken(token: ChogToken | null): ChogToken | null {
  const [shown, setShown] = useState<ChogToken | null>(token);
  const id = token?.tokenId ?? "";
  useEffect(() => {
    let cancelled = false;
    const src = heroSrc(token);
    const ready = src ? decodeImage(src) : Promise.resolve();
    ready.then(() => {
      if (!cancelled) setShown(token);
    });
    return () => {
      cancelled = true;
    };
    // the id is what identifies the token
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  return shown;
}
