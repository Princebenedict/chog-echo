"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ChogAvatar } from "./chog-avatar";
import type { ChogToken } from "@/lib/types";

const LINES = ["Squaring up", "Trading blows", "Sharpening their words", "Almost there"];

const star = (spikes: number, outer: number, inner: number) =>
  Array.from({ length: spikes * 2 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i * Math.PI) / spikes - Math.PI / 2;
    return `${(80 + Math.cos(a) * r).toFixed(1)},${(80 + Math.sin(a) * r).toFixed(1)}`;
  }).join(" ");

const BURST = star(13, 74, 38);
const INNER_BURST = star(13, 50, 26);
const SPARKS = Array.from({ length: 10 }, (_, i) => {
  const a = (i / 10) * Math.PI * 2;
  return { x1: 80 + Math.cos(a) * 62, y1: 80 + Math.sin(a) * 62, x2: 80 + Math.cos(a) * 80, y2: 80 + Math.sin(a) * 80 };
});

function Crown() {
  return (
    <svg viewBox="0 0 48 32" aria-hidden className="h-8 w-12 drop-shadow-[0_4px_10px_rgba(216,180,90,.6)]">
      <path d="M4 26 2 8l11 9L24 4l11 13 11-9-2 18z" fill="#D8B45A" stroke="#F6E7B8" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="5" y="26" width="38" height="4" rx="2" fill="#B8923A" />
    </svg>
  );
}

const CYCLE = 2;
const TIMES = [0, 0.22, 0.4, 0.5, 1];

// The fight scene shown while answers are being written, and the result once they are in.
export function ArenaStage({
  a,
  b,
  clashing,
  winner,
  finished,
}: {
  a: ChogToken;
  b: ChogToken;
  clashing: boolean;
  winner: "a" | "b" | null;
  finished: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ size: 108, reach: 120 });
  const [line, setLine] = useState(0);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      const size = Math.round(Math.min(124, Math.max(76, w * 0.19)));
      setDims({ size, reach: Math.max(40, w / 2 - 6 - (w * 0.08 + size)) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!clashing) return;
    setLine(0);
    const t = window.setInterval(() => setLine((n) => Math.min(n + 1, LINES.length - 1)), 2600);
    return () => window.clearInterval(t);
  }, [clashing]);

  const fighters = [
    { key: "a" as const, token: a, side: "left" as const },
    { key: "b" as const, token: b, side: "right" as const },
  ];

  const status = clashing
    ? LINES[line]
    : winner
      ? `${winner === "a" ? a.name : b.name} takes it`
      : finished
        ? "Pick a winner below"
        : "Ready";

  const { size, reach } = dims;
  const lunge = (dir: 1 | -1) => ({
    x: [0, -14 * dir, reach * dir, reach * dir, 0],
    rotate: [0, -6 * dir, 8 * dir, 8 * dir, 0],
    scale: [1, 0.95, 1.07, 1.07, 1],
  });

  return (
    <div
      ref={box}
      aria-label="Battle arena"
      className="glass-solid relative h-60 overflow-hidden rounded-3xl sm:h-72"
    >
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-1/2"
        style={{ background: "radial-gradient(closest-side at 25% 55%, rgb(var(--amb-a-r) var(--amb-a-g) var(--amb-a-b) / .38), transparent 80%)" }}
      />
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 w-1/2"
        style={{ background: "radial-gradient(closest-side at 75% 55%, rgb(var(--amb-b-r) var(--amb-b-g) var(--amb-b-b) / .38), transparent 80%)" }}
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-50"
        style={{ backgroundImage: "radial-gradient(rgba(246,240,255,.09) 1.4px, transparent 1.6px)", backgroundSize: "18px 18px" }}
      />
      <div aria-hidden className="absolute inset-x-8 bottom-[22%] h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <motion.div
        className="absolute inset-0"
        animate={clashing ? { x: [0, 0, -5, 5, -3, 3, 0, 0] } : { x: 0 }}
        transition={
          clashing
            ? { duration: CYCLE, times: [0, 0.4, 0.43, 0.46, 0.49, 0.52, 0.56, 1], repeat: Infinity, ease: "linear" }
            : { duration: 0.2 }
        }
      >
        {fighters.map(({ key, token, side }) => {
          const dir = side === "left" ? 1 : -1;
          const isWinner = winner === key;
          const isLoser = winner !== null && !isWinner;
          return (
            <div
              key={key}
              className="absolute top-[54%] -translate-y-1/2"
              style={side === "left" ? { left: "8%" } : { right: "8%" }}
            >
              <motion.div
                animate={
                  clashing
                    ? lunge(dir)
                    : isWinner
                      ? { x: 0, rotate: 0, scale: 1.14 }
                      : isLoser
                        ? { x: 0, rotate: -5 * dir, scale: 0.92 }
                        : { x: 0, rotate: 0, scale: 1 }
                }
                transition={
                  clashing
                    ? { duration: CYCLE, times: TIMES, repeat: Infinity, ease: ["easeOut", "easeIn", "linear", "easeInOut"] }
                    : { type: "spring", stiffness: 200, damping: 16 }
                }
                style={{ opacity: isLoser ? 0.6 : 1, filter: isLoser ? "saturate(.5)" : "none", transition: "opacity .4s, filter .4s" }}
                className="relative"
              >
                {isWinner && (
                  <motion.div initial={{ y: -14, opacity: 0, rotate: -12 }} animate={{ y: 0, opacity: 1, rotate: -6 }} transition={{ type: "spring", stiffness: 220, damping: 14 }} className="absolute -top-7 left-1/2 -translate-x-1/2">
                    <Crown />
                  </motion.div>
                )}
                <ChogAvatar image={token.image} seed={JSON.stringify(token.traits)} name={token.name} size={size} idle={!clashing} />
              </motion.div>
              <p className="mt-3 text-center text-xs font-semibold text-lavender" style={{ maxWidth: size + 24 }}>
                {token.name}
              </p>
            </div>
          );
        })}

        <div className="clash-fx pointer-events-none absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-[62%]">
          <motion.svg
            viewBox="0 0 160 160"
            aria-hidden
            className="h-full w-full"
            initial={{ scale: 0, opacity: 0 }}
            animate={clashing ? { scale: [0, 0, 1.2, 0.95, 0], opacity: [0, 0, 1, 0.9, 0], rotate: [0, 0, 10, -6, 0] } : { scale: 0, opacity: 0 }}
            transition={clashing ? { duration: CYCLE, times: [0, 0.4, 0.46, 0.6, 0.74], repeat: Infinity, ease: "easeOut" } : { duration: 0.2 }}
          >
            <polygon points={BURST} fill="#FFE27A" stroke="#10081D" strokeWidth="4" strokeLinejoin="round" />
            <polygon points={INNER_BURST} fill="#55F0B0" opacity="0.85" />
            {SPARKS.map((s, i) => (
              <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="#F6F0FF" strokeWidth="4" strokeLinecap="round" />
            ))}
          </motion.svg>
        </div>
      </motion.div>

      <div className="absolute inset-x-0 bottom-3 flex justify-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={status}
            role="status"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="rounded-full border border-white/10 bg-ink/70 px-4 py-1.5 text-sm font-semibold text-bone"
          >
            {status}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
