"use client";

import { AnimatePresence, motion, useTransform } from "framer-motion";
import type { CSSProperties } from "react";
import { usePointer } from "@/hooks/use-pointer";
import type { ChogToken } from "@/lib/types";

const A = "var(--amb-a-r) var(--amb-a-g) var(--amb-a-b)";

// Shows the selected Chog. It leans toward the pointer and squishes when poked.
export function HeroChog({ token }: { token: ChogToken | null }) {
  const { x, y } = usePointer();
  const rotate = useTransform(x, [-1, 1], [-7, 7]);
  const shiftX = useTransform(x, [-1, 1], [-12, 12]);
  const shiftY = useTransform(y, [-1, 1], [-8, 8]);

  const isMain = !token || token.tokenId === "sample-a";
  const key = token?.tokenId ?? "main";
  const bob = { animation: "bob 6s ease-in-out infinite", "--r": "1.5deg" } as CSSProperties;

  return (
    <div className="relative mx-auto flex aspect-square w-full max-w-[15rem] md:max-w-[21rem] select-none items-center justify-center">
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
        className="relative w-[76%]"
        style={{ rotate, x: shiftX, y: shiftY }}
        whileTap={{ scaleX: 1.07, scaleY: 0.9 }}
        transition={{ type: "spring", stiffness: 500, damping: 12 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={key}
            initial={{ opacity: 0, scale: 0.86, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -10 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
            <div style={bob}>
              {isMain ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="/chog/main-cutout.png"
                  alt="The main Chog, a purple spiky-haired character with a small smile"
                  draggable={false}
                  className="w-full drop-shadow-[0_24px_36px_rgba(8,3,18,.6)] [mask-image:linear-gradient(to_bottom,black_80%,transparent)]"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={token?.image ?? ""}
                  alt={token?.name ?? ""}
                  draggable={false}
                  className="aspect-square w-full rounded-[2rem] bg-plum object-cover shadow-[0_24px_50px_-16px_rgba(8,3,18,.8)] ring-1 ring-white/20"
                />
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
