"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import { MEME_H, MEME_W, renderMeme, type MemeInfo, type MemeSpec } from "@/lib/meme";

// Draws the meme off-screen and swaps it in with a single drawImage, so changing text or layout never blanks the picture.
export function MemeCanvas({
  spec,
  info,
  canvasRef,
}: {
  spec: MemeSpec;
  info: MemeInfo;
  canvasRef?: MutableRefObject<HTMLCanvasElement | null>;
}) {
  const local = useRef<HTMLCanvasElement | null>(null);
  const job = useRef(0);

  useEffect(() => {
    const id = ++job.current;
    renderMeme(spec, info)
      .then((off) => {
        const c = local.current;
        if (id !== job.current || !c) return;
        if (c.width !== off.width) c.width = off.width;
        if (c.height !== off.height) c.height = off.height;
        c.getContext("2d")?.drawImage(off, 0, 0);
      })
      .catch(() => {});
    // the individual fields are the real inputs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec.layout, spec.top, spec.bottom, spec.caption, info.name, info.archetype, info.imageSrc]);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-ink/60" style={{ aspectRatio: `${MEME_W} / ${MEME_H}` }}>
      <canvas
        ref={(el) => {
          local.current = el;
          if (canvasRef) canvasRef.current = el;
        }}
        role="img"
        aria-label={spec.description || "Meme preview"}
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}
