"use client";

import { animate, motion, motionValue, useMotionValue, useTransform, type MotionValue } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { AXIS_COLORS, describeEffect } from "@/lib/dna-text";
import { AXIS_LABELS, type AxisKey, type Category, type Persona, type TraitEffect } from "@/lib/personality";

const AXES = Object.keys(AXIS_LABELS) as AxisKey[];
const CENTER = 100;
const OUTER = 72;
const INNER = 14;

const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / AXES.length;
const radius = (v: number) => INNER + (v / 10) * (OUTER - INNER);
const point = (i: number, v: number): [number, number] => [CENTER + Math.cos(angle(i)) * radius(v), CENTER + Math.sin(angle(i)) * radius(v)];
const ring = (value: number) => AXES.map((_, i) => point(i, value).join(",")).join(" ");

function AnimatedNumber({ value }: { value: number }) {
  const mv = useMotionValue(value);
  const rounded = useTransform(mv, (v) => Math.round(v));
  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.7, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [value, mv]);
  return <motion.span>{rounded}</motion.span>;
}

// The shape morphs with a spring when you pick another Chog. Updates go straight to the SVG, with no re-rendering.
function Radar({ values, active }: { values: number[]; active: AxisKey | null }) {
  const mvs = useRef<MotionValue<number>[]>(values.map((v) => motionValue(v))).current;
  const polyRef = useRef<SVGPolygonElement>(null);
  const dotRefs = useRef<(SVGCircleElement | null)[]>([]);
  const signature = values.join(",");

  useEffect(() => {
    const paint = () => {
      const vals = mvs.map((m) => m.get());
      polyRef.current?.setAttribute("points", vals.map((v, i) => point(i, v).join(",")).join(" "));
      dotRefs.current.forEach((dot, i) => {
        if (!dot) return;
        const [x, y] = point(i, vals[i]);
        dot.setAttribute("cx", String(x));
        dot.setAttribute("cy", String(y));
      });
    };
    paint();
    const unsubs = mvs.map((m) => m.on("change", paint));
    return () => unsubs.forEach((off) => off());
  }, [mvs]);

  useEffect(() => {
    const controls = values.map((v, i) => animate(mvs[i], v, { type: "spring", stiffness: 110, damping: 17 }));
    return () => controls.forEach((c) => c.stop());
    // `signature` stands for the values
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[13.5rem]">
      <div
        aria-hidden
        className="dna-sweep absolute inset-[14%] rounded-full opacity-70"
        style={{
          background: "conic-gradient(from 0deg, rgba(85,240,176,.22), rgba(85,240,176,0) 22%)",
          animation: "ring-spin 9s linear infinite",
          WebkitMask: "radial-gradient(circle, transparent 0, #000 1px)",
        }}
      />
      <svg viewBox="0 0 200 200" role="img" aria-label="Radar chart of the five Voice DNA scores" className="absolute inset-0 h-full w-full overflow-visible">
        <defs>
          <linearGradient id="dna-fill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8754F6" stopOpacity="0.62" />
            <stop offset="100%" stopColor="#55F0B0" stopOpacity="0.42" />
          </linearGradient>
        </defs>
        {[2.5, 5, 7.5, 10].map((v) => (
          <polygon key={v} points={ring(v)} fill="none" stroke="rgba(190,145,255,.16)" strokeWidth={v === 10 ? 1.2 : 0.8} />
        ))}
        {AXES.map((axis, i) => {
          const [x, y] = point(i, 10);
          return <line key={axis} x1={CENTER} y1={CENTER} x2={x} y2={y} stroke="rgba(190,145,255,.14)" strokeWidth="0.8" />;
        })}
        <polygon
          ref={polyRef}
          fill="url(#dna-fill)"
          stroke="#A46CFF"
          strokeWidth="2"
          strokeLinejoin="round"
          style={{ filter: "drop-shadow(0 0 10px rgba(135,84,246,.65))" }}
        />
        {AXES.map((axis, i) => (
          <circle
            key={axis}
            ref={(el) => {
              dotRefs.current[i] = el;
            }}
            r={active === axis ? 6.5 : 4.2}
            fill={AXIS_COLORS[axis]}
            stroke="#10081D"
            strokeWidth="2"
            style={{ transition: "r 200ms ease", opacity: active && active !== axis ? 0.45 : 1 }}
          />
        ))}
      </svg>
    </div>
  );
}

const ICONS: Record<Category, string> = {
  background: "M3 17l5-6 4 4 3-3 6 5M3 5h18v14H3z",
  aura: "M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z",
  headwear: "M4 15a8 8 0 0 1 16 0M2.5 15h19M7 9.5 12 6l5 3.5",
  eyes: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 9.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6z",
  mouth: "M5 10c1.2 5.5 12.8 5.5 14 0M9 8.5v.01M15 8.5v.01",
  outfit: "M8 3 3 6l2 4 2-1v12h10V9l2 1 2-4-5-3a4 4 0 0 1-8 0z",
  item: "M12 3l2.2 5.3 5.8.5-4.4 3.8 1.4 5.6L12 15.2 7 18.2l1.4-5.6L4 8.8l5.8-.5z",
  other: "M6 6h.01M12 6h.01M18 6h.01M6 12h.01M12 12h.01M18 12h.01M6 18h.01M12 18h.01M18 18h.01",
};

function TraitIcon({ category }: { category: Category }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d={ICONS[category]} />
    </svg>
  );
}

export function VoiceDna({ persona, tokenKey, onShare }: { persona: Persona; tokenKey: string; onShare?: () => void }) {
  const [hover, setHover] = useState<{ type: "axis"; axis: AxisKey } | { type: "trait"; index: number } | null>(null);
  const values = AXES.map((a) => persona.axes[a]);

  const touches = (effect: TraitEffect, axis: AxisKey) => (effect.deltas[axis] ?? 0) !== 0;
  const activeAxis = hover?.type === "axis" ? hover.axis : null;
  const activeTrait = hover?.type === "trait" ? persona.effects[hover.index] : null;

  const axisDim = (axis: AxisKey) => (activeTrait ? !touches(activeTrait, axis) : false);
  const traitDim = (i: number) => (hover?.type === "axis" ? !touches(persona.effects[i], hover.axis) : hover?.type === "trait" ? hover.index !== i : false);
  const radarFocus: AxisKey | null = activeAxis ?? (activeTrait ? (AXES.find((a) => touches(activeTrait, a)) ?? null) : null);

  return (
    <section aria-label="Voice DNA" className="glass rounded-3xl p-5 sm:p-6" onMouseLeave={() => setHover(null)}>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-lavender">Voice DNA</h2>
        <motion.p
          key={`arch-${tokenKey}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mt-1 bg-gradient-to-r from-bone via-electric to-mint bg-clip-text pb-[0.1em] font-display text-3xl font-extrabold leading-tight tracking-tight text-transparent"
        >
          {persona.archetype}
        </motion.p>
        <p className="mt-1 text-sm text-lavender">Posts stay under {persona.maxWords} words</p>
      </div>

      <div className="mt-5 grid items-center gap-4 sm:grid-cols-[minmax(0,13.5rem)_minmax(0,1fr)]">
        <Radar values={values} active={radarFocus} />

        <dl className="space-y-1">
          {AXES.map((axis) => {
            const color = AXIS_COLORS[axis];
            const focused = activeAxis === axis;
            return (
              <div
                key={axis}
                tabIndex={0}
                onMouseEnter={() => setHover({ type: "axis", axis })}
                onFocus={() => setHover({ type: "axis", axis })}
                onBlur={() => setHover(null)}
                className="rounded-xl px-2.5 py-1.5 outline-none transition-[opacity,background-color] duration-200 focus-visible:ring-2 focus-visible:ring-mint"
                style={{ opacity: axisDim(axis) ? 0.4 : 1, backgroundColor: focused ? "rgba(255,255,255,.05)" : "transparent" }}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="flex items-center gap-2 text-sm font-medium text-bone/90">
                    <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: color, boxShadow: `0 0 10px ${color}` }} />
                    {AXIS_LABELS[axis]}
                  </dt>
                  <dd className="font-display text-lg font-bold tabular-nums text-bone">
                    <AnimatedNumber value={persona.axes[axis]} />
                    <span className="ml-0.5 text-xs font-medium text-lavender/70">/10</span>
                  </dd>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${color}66, ${color})`, boxShadow: `0 0 12px ${color}88` }}
                    initial={false}
                    animate={{ width: `${persona.axes[axis] * 10}%` }}
                    transition={{ type: "spring", stiffness: 120, damping: 20 }}
                  />
                </div>
              </div>
            );
          })}
        </dl>
      </div>

      <p className="mt-6 text-sm font-semibold text-lavender">What shapes it</p>
      <ul className="scroll-thin mt-3 h-[29rem] space-y-2 overflow-y-auto pr-1">
        {persona.effects.map((effect, i) => {
          const { detail, seeded } = describeEffect(effect);
          const deltas = (Object.entries(effect.deltas) as [AxisKey, number][]).filter(([, v]) => v !== 0);
          return (
            <motion.li
              key={`${tokenKey}-${i}`}
              tabIndex={0}
              onMouseEnter={() => setHover({ type: "trait", index: i })}
              onFocus={() => setHover({ type: "trait", index: i })}
              onBlur={() => setHover(null)}
              initial={{ opacity: 0.3, y: 6 }}
              animate={{ opacity: traitDim(i) ? 0.42 : 1, y: 0 }}
              transition={{ opacity: { duration: 0.22 }, y: { duration: 0.35, delay: Math.min(i * 0.04, 0.2) } }}
              className="flex gap-3 rounded-2xl border border-white/[0.06] bg-ink/40 p-3 outline-none transition-colors duration-200 hover:border-electric/30 focus-visible:ring-2 focus-visible:ring-mint"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet/15 text-electric ring-1 ring-inset ring-electric/20">
                <TraitIcon category={effect.category} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-baseline gap-x-2 leading-tight">
                  <span className="text-[0.95rem] font-semibold text-bone">{effect.trait.value}</span>
                  <span className="text-xs text-lavender/80">{effect.trait.trait_type}</span>
                </p>
                <p className="mt-1 text-[0.82rem] leading-snug text-bone/70">{detail}</p>
              </div>
              {deltas.length > 0 && (
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {deltas.map(([axis, v]) => (
                    <span
                      key={axis}
                      title={`${seeded ? "Seeded quirk. " : ""}${v > 0 ? "Raises" : "Lowers"} ${AXIS_LABELS[axis]} by ${Math.abs(v)}`}
                      className="whitespace-nowrap rounded-full px-2 py-0.5 text-[0.7rem] font-semibold"
                      style={{ color: AXIS_COLORS[axis], background: `${AXIS_COLORS[axis]}22`, boxShadow: `inset 0 0 0 1px ${AXIS_COLORS[axis]}44` }}
                    >
                      {AXIS_LABELS[axis]} {v > 0 ? "+" : "−"}
                      {Math.abs(v)}
                    </span>
                  ))}
                </div>
              )}
            </motion.li>
          );
        })}
        {persona.effects.length === 0 && (
          <li className="text-sm text-lavender">This token has no readable traits, so it has no voice yet.</li>
        )}
      </ul>

      {onShare && (
        <button
          onClick={onShare}
          className="mt-5 w-full rounded-full border border-electric/30 bg-ink/50 py-2.5 text-sm font-semibold text-bone transition duration-200 hover:border-mint/50 hover:bg-ink/80 active:scale-[0.98]"
        >
          Share Voice DNA
        </button>
      )}
    </section>
  );
}
