"use client";

import { useMemo, useRef } from "react";
import { MemeCanvas } from "./meme-canvas";
import { downloadCanvas } from "@/lib/canvas";
import type { MemeLayoutId, MemeSpec } from "@/lib/meme";
import { derivePersona } from "@/lib/personality";
import type { FeedItem } from "@/lib/types";

// Re-draws a saved meme from its text and layout, so the feed never has to store image files.
export function FeedMeme({ item }: { item: FeedItem }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const spec = item.meme as (MemeSpec & { layout: MemeLayoutId }) | undefined;
  const archetype = useMemo(() => derivePersona(item.traits).archetype, [item.traits]);
  const info = useMemo(
    () => ({ name: item.tokenName, archetype, imageSrc: item.imageSrc ?? null }),
    [item.tokenName, archetype, item.imageSrc],
  );
  if (!spec) return null;

  return (
    <div className="mt-3 max-w-[16rem]">
      <MemeCanvas spec={spec} info={info} canvasRef={canvasRef} />
      <button
        onClick={() => canvasRef.current && downloadCanvas(canvasRef.current, `chog-echo-meme-${item.id}.png`)}
        className="mt-3 rounded-full border border-white/10 bg-grape px-4 py-1.5 text-sm font-semibold transition duration-200 hover:bg-plum active:scale-[0.97]"
      >
        Download image
      </button>
    </div>
  );
}
