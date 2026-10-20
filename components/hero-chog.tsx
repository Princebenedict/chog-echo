"use client";

import { motion, useTransform } from "framer-motion";
import { useEffect, useState, type CSSProperties } from "react";
import { heroSrc, useReadyToken } from "@/hooks/use-preload";
import { usePointer } from "@/hooks/use-pointer";
import type { ChogToken } from "@/lib/types";

const A = "var(--amb-a-r) var(--amb-a-g) var(--amb-a-b)";

type Layer = { key: string; token: ChogToken | null; fresh: boolean };

function HeroImage({ token }: { token: ChogToken | null }) {
  const src = heroSrc(token);
  if (!src) return null;
  if (!token || token.tokenId === "sample-a") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt="The main Chog, a purple spiky-haired character with a small smile"
        draggable={false}
        className="w-full drop-shadow-[0_24px_36px_rgba(8,3,18,.6)] [mask-image:linear-gradient(to_bottom,black_80%,transparent)]"
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={token.name}
      draggable={false}
      className="aspect-square w-full rounded-[2rem] bg-plum object-cover shadow-[0_24px_50px_-16px_rgba(8,3,18,.8)] ring-1 ring-white/20"
    />
  );
}

// Shows the selected Chog. The next picture is fully loaded before it fades in, and the old one fades out at
// the same moment, so there is never an empty frame. The frame has a fixed size, so nothing around it moves.
export function HeroChog({ token }: { token: ChogToken | null }) {
  const { x, y } = usePointer();
  const rotate = useTransform(x, [-1, 1], [-7, 7]);
  const shiftX = useTransform(x, [-1, 1], [-12, 12]);
  const shiftY = useTransform(y, [-1, 1], [-8, 8]);

  const shown = useReadyToken(token);
  const key = shown?.tokenId ?? "main";
  const [layers, setLayers] = useState<Layer[]>([{ key, token: shown, fresh: false }]);

  // The old picture stays fully visible underneath while the new one fades in on top of it, so there is never
  // a moment with nothing on screen. Layers underneath are removed only after the top one has finished fading in.
  useEffect(() => {
    setLayers((prev) => (prev[prev.length - 1].key === key ? prev : [...prev, { key, token: shown, fresh: true }]));
    // the key identifies the picture on screen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const settle = (doneKey: string) =>
    setLayers((prev) => (prev.length > 1 && prev[prev.length - 1].key === doneKey ? prev.slice(-1) : prev));

  const bob = { animation: "bob 6s ease-in-out infinite", "--r": "1.5deg" } as CSSProperties;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[15rem] select-none md:max-w-[21rem]">
      <div aria-hidden className="absolute inset-[4%] rounded-full border border-electric/20" />
      <div
        aria-hidden
        className="absolute inset-[15%] rounded-full border border-dashed border-mint/25"
        style={{ animation: "ring-spin 70s linear infinite" }}
      />
      <div
        aria-hidden
        className="absolute inset-[12%] rounded-full"
        style={{
          background: `radial-gradient(closest-side, rgb(${A} / .5), rgb(${A} / .16) 60%, transparent 78%)`,
          animation: "glow-breathe 5s ease-in-out infinite alternate",
        }}
      />

      <motion.div
        className="absolute inset-[12%]"
        style={{ rotate, x: shiftX, y: shiftY }}
        whileTap={{ scaleX: 1.07, scaleY: 0.9 }}
        transition={{ type: "spring", stiffness: 500, damping: 12 }}
      >
        {layers.map((layer) => (
          <motion.div
            key={layer.key}
            className="absolute inset-0 flex items-center justify-center"
            initial={layer.fresh ? { opacity: 0, scale: 0.96 } : false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            onAnimationComplete={() => settle(layer.key)}
          >
            <div style={bob} className="w-full">
              <HeroImage token={layer.token} />
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
