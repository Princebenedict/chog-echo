"use client";

import { motion } from "framer-motion";
import { AXIS_LABELS, type AxisKey, type Persona } from "@/lib/personality";

export function VoiceDna({ persona, tokenKey }: { persona: Persona; tokenKey: string }) {
  const axes = Object.keys(AXIS_LABELS) as AxisKey[];

  return (
    <section aria-label="Voice DNA" className="glass rounded-3xl p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-xl font-bold tracking-tight">Voice DNA</h2>
        <motion.p
          key={`arch-${tokenKey}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-full border border-mint/30 bg-mint/10 px-3 py-1 text-sm font-semibold text-mint"
        >
          {persona.archetype}
        </motion.p>
      </div>

      <dl key={`axes-${tokenKey}`} className="mt-5 space-y-3">
        {axes.map((k, i) => (
          <div key={k} className="grid grid-cols-[5.75rem_1fr] items-center gap-3">
            <dt className="text-sm text-lavender">{AXIS_LABELS[k]}</dt>
            <dd className="h-2.5 overflow-hidden rounded-full bg-white/[0.06] ring-1 ring-inset ring-white/5">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-violet via-electric to-mint shadow-[0_0_14px_rgba(164,108,255,.55)]"
                initial={{ width: 0 }}
                animate={{ width: `${persona.axes[k] * 10}%` }}
                transition={{ delay: 0.06 * i, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              />
            </dd>
          </div>
        ))}
      </dl>

      <ul key={`fx-${tokenKey}`} className="mt-6 space-y-3.5 border-t border-white/10 pt-5">
        {persona.effects.map((e, i) => (
          <motion.li
            key={`${e.trait.trait_type}-${e.trait.value}-${i}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.06 }}
            className="border-l-2 border-violet/60 pl-3.5 text-sm leading-snug"
          >
            <p>
              <span className="text-lavender">{e.trait.trait_type}</span>{" "}
              <span className="font-semibold text-bone">{e.trait.value}</span>
            </p>
            <p className={`mt-0.5 ${e.matched ? "text-bone/80" : "text-lavender/70"}`}>{e.effect}</p>
          </motion.li>
        ))}
        {persona.effects.length === 0 && (
          <li className="text-sm text-lavender">This token has no readable traits, so it has no voice yet.</li>
        )}
      </ul>
    </section>
  );
}
