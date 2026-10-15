"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";
import type { CSSProperties } from "react";
import { usePointer } from "@/hooks/use-pointer";

const TILES = [1, 2, 3, 4, 5].map((n) => `/chog/nft-${n}.jpg`);

const A = "var(--amb-a-r) var(--amb-a-g) var(--amb-a-b)";
const B = "var(--amb-b-r) var(--amb-b-g) var(--amb-b-b)";

// A very faint belt of collection art. Two identical sets make the loop seamless.
function Belt({ top, size, seconds, reverse, shift }: { top: string; size: number; seconds: number; reverse?: boolean; shift: number }) {
  const ordered = [...TILES.slice(shift), ...TILES.slice(0, shift)];
  const set = [...ordered, ...ordered, ...ordered];
  const style: CSSProperties = {
    top,
    animation: `marquee ${seconds}s linear infinite ${reverse ? "reverse" : "normal"}`,
  };

  return (
    <div className="absolute left-0 flex w-max" style={style}>
      {[0, 1].map((copy) => (
        <div key={copy} className="flex shrink-0 gap-6 pr-6">
          {set.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${copy}-${i}`}
              src={src}
              alt=""
              loading="lazy"
              draggable={false}
              className="shrink-0 rounded-[2rem] object-cover"
              style={{ width: size, height: size, transform: `rotate(${((i % 3) - 1) * 3}deg)` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

type Floater = {
  src: string;
  kind: "cutout" | "tile";
  left: string;
  top: string;
  size: number;
  depth: number;
  dur: number;
  delay: number;
  rot: number;
};

const FLOATERS: Floater[] = [
  { src: "/chog/main-cutout.png", kind: "cutout", left: "2%", top: "22%", size: 130, depth: 26, dur: 7, delay: 0, rot: -5 },
  { src: "/chog/nft-3.jpg", kind: "tile", left: "91%", top: "16%", size: 86, depth: 38, dur: 5.4, delay: 0.8, rot: 7 },
  { src: "/chog/main-cutout.png", kind: "cutout", left: "92%", top: "62%", size: 108, depth: 18, dur: 7.6, delay: 1.4, rot: 6 },
  { src: "/chog/nft-1.jpg", kind: "tile", left: "4%", top: "68%", size: 76, depth: 34, dur: 6.2, delay: 0.3, rot: -8 },
];

function FloaterView({ f, px, py }: { f: Floater; px: MotionValue<number>; py: MotionValue<number> }) {
  const x = useTransform(px, [-1, 1], [-f.depth, f.depth]);
  const y = useTransform(py, [-1, 1], [-f.depth, f.depth]);
  const bob = { animation: `bob ${f.dur}s ease-in-out ${f.delay}s infinite`, "--r": `${f.rot}deg` } as CSSProperties;

  return (
    <motion.div className="absolute hidden opacity-40 lg:block" style={{ left: f.left, top: f.top, x, y }}>
      <div style={bob}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={f.src}
          alt=""
          draggable={false}
          style={{ width: f.size, height: f.kind === "cutout" ? "auto" : f.size }}
          className={
            f.kind === "cutout"
              ? "[mask-image:linear-gradient(to_bottom,black_70%,transparent)]"
              : "rounded-[1.4rem] object-cover ring-1 ring-white/15"
          }
        />
      </div>
    </motion.div>
  );
}

const NOISE =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

const DUST =
  "radial-gradient(1.4px 1.4px at 20px 30px, rgba(246,240,255,.55), transparent 60%), radial-gradient(1.2px 1.2px at 80px 90px, rgba(164,108,255,.7), transparent 60%), radial-gradient(1px 1px at 110px 20px, rgba(246,240,255,.4), transparent 60%), radial-gradient(1.3px 1.3px at 50px 110px, rgba(85,240,176,.45), transparent 60%)";

export function ChogWorld() {
  const pointer = usePointer();

  return (
    <div aria-hidden className="world pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* base: deep violet to near black */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(120% 90% at 50% -10%, #1d1230 0%, #160d26 38%, #10081d 70%)" }}
      />

      {/* large drifting light fields, no blur filters so they stay cheap */}
      <div
        className="absolute -left-[18%] -top-[22%] h-[80vmax] w-[80vmax]"
        style={{
          background: `radial-gradient(closest-side, rgb(${A} / .46), rgb(${A} / .16) 55%, transparent 75%)`,
          animation: "drift-a 22s ease-in-out infinite alternate",
        }}
      />
      <div
        className="absolute -right-[22%] top-[8%] h-[70vmax] w-[70vmax]"
        style={{
          background: `radial-gradient(closest-side, rgb(${B} / .30), rgb(${B} / .1) 55%, transparent 75%)`,
          animation: "drift-b 26s ease-in-out infinite alternate",
        }}
      />
      <div
        className="absolute -bottom-[30%] left-[18%] h-[75vmax] w-[75vmax]"
        style={{
          background: "radial-gradient(closest-side, rgba(104,58,206,.38), rgba(104,58,206,.12) 55%, transparent 75%)",
          animation: "drift-c 24s ease-in-out infinite alternate",
        }}
      />
      <div
        className="absolute -bottom-[24%] -right-[10%] h-[46vmax] w-[46vmax]"
        style={{
          background: "radial-gradient(closest-side, rgba(85,240,176,.14), rgba(85,240,176,.05) 55%, transparent 75%)",
          animation: "drift-a 30s ease-in-out -9s infinite alternate-reverse",
        }}
      />

      {/* faint collection art belts, masked so the middle of the page stays calm */}
      <div
        className="absolute inset-x-0 top-0 h-[26%] opacity-[0.05]"
        style={{
          maskImage: "linear-gradient(to bottom, black, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
        }}
      >
        <Belt top="6%" size={190} seconds={120} shift={0} />
      </div>
      <div
        className="absolute inset-x-0 bottom-0 h-[26%] opacity-[0.05]"
        style={{
          maskImage: "linear-gradient(to top, black, transparent)",
          WebkitMaskImage: "linear-gradient(to top, black, transparent)",
        }}
      >
        <Belt top="48%" size={190} seconds={140} reverse shift={3} />
      </div>

      {/* slow dust: one oversized layer moved with a single transform */}
      <div
        className="absolute -inset-[240px] opacity-70"
        style={{ backgroundImage: DUST, backgroundSize: "120px 120px", animation: "dust 90s linear infinite" }}
      />

      {/* fine grain adds depth without moving */}
      <div className="absolute inset-0 opacity-[0.045] mix-blend-overlay" style={{ backgroundImage: NOISE }} />

      {/* soft vignette keeps edges dark and text readable */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 40%, transparent 45%, rgba(16,8,29,.7) 100%)" }}
      />

      {FLOATERS.map((f, i) => (
        <FloaterView key={i} f={f} px={pointer.x} py={pointer.y} />
      ))}

      {/* a Chog rolling along the bottom of the page */}
      <div
        className="roller absolute bottom-3 left-0 hidden h-[88px] w-[88px] opacity-60 md:block"
        style={{ animation: "roll-x 32s linear infinite" }}
      >
        <div className="h-full w-full" style={{ animation: "hop 0.9s ease-in-out infinite" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/chog/main.jpg"
            alt=""
            draggable={false}
            className="h-full w-full rounded-full object-cover shadow-[0_10px_28px_rgba(0,0,0,.55)] ring-2 ring-mint/60"
            style={{ animation: "roll-spin 32s linear infinite" }}
          />
        </div>
      </div>
    </div>
  );
}
