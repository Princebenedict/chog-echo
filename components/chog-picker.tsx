"use client";

import { motion } from "framer-motion";
import { useRef } from "react";
import { ChogAvatar } from "./chog-avatar";
import type { ChogToken } from "@/lib/types";

export function ChogPicker({
  tokens,
  selectedId,
  onSelect,
}: {
  tokens: ChogToken[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const current = Math.max(0, tokens.findIndex((t) => t.tokenId === selectedId));
    const next = (current + (e.key === "ArrowRight" ? 1 : -1) + tokens.length) % tokens.length;
    onSelect(tokens[next].tokenId);
    requestAnimationFrame(() => {
      const el = refs.current[next];
      el?.focus();
      el?.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "smooth" });
    });
  }

  return (
    <div
      role="radiogroup"
      aria-label="Choose a Chog"
      onKeyDown={onKeyDown}
      className="scroll-thin glass -mx-1 flex snap-x gap-2.5 overflow-x-auto rounded-3xl p-2.5 [mask-image:linear-gradient(to_right,black_calc(100%-44px),transparent)]"
    >
      {tokens.map((t, i) => {
        const selected = t.tokenId === selectedId;
        return (
          <motion.button
            key={t.tokenId}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="radio"
            aria-checked={selected}
            tabIndex={selected || (!selectedId && i === 0) ? 0 : -1}
            onClick={() => onSelect(t.tokenId)}
            whileHover={{ y: -3, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 420, damping: 26 }}
            className={`relative flex w-[6.75rem] shrink-0 snap-start flex-col items-center gap-2 rounded-2xl p-2.5 text-center transition-colors duration-200 ${
              selected ? "text-bone" : "text-lavender hover:text-bone"
            }`}
          >
            {selected && (
              <motion.span
                layoutId="picker-highlight"
                aria-hidden
                className="absolute inset-0 rounded-2xl border border-mint/60 bg-mint/10 shadow-[0_0_0_1px_rgba(85,240,176,.25),0_14px_36px_-14px_rgba(85,240,176,.55)]"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative">
              <ChogAvatar image={t.image} seed={JSON.stringify(t.traits)} name={t.name} size={68} idle />
            </span>
            <span className="relative line-clamp-2 text-xs font-semibold leading-tight">{t.name}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
