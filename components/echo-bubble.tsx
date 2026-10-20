"use client";

import { motion } from "framer-motion";
import { useMemo, type ReactNode } from "react";
import { ChogAvatar } from "./chog-avatar";
import { StreamText } from "./stream-text";
import { derivePersona } from "@/lib/personality";
import type { ChogToken } from "@/lib/types";

export function EchoBubble({
  token,
  text,
  streaming,
  placeholder,
  actions,
  highlight = false,
  animateKey,
}: {
  token: ChogToken;
  text: string;
  streaming: boolean;
  placeholder: string;
  actions?: ReactNode;
  highlight?: boolean;
  animateKey?: string | number;
}) {
  const seed = JSON.stringify(token.traits);
  const archetype = useMemo(() => derivePersona(token.traits).archetype, [token]);
  const surface = highlight ? "#BDF8DD" : "#EDE5FF";

  return (
    <motion.div
      key={animateKey ?? "bubble"}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className="flex items-start gap-3.5 sm:gap-4"
    >
      <div className="relative shrink-0">
        {streaming && (
          <span
            aria-hidden
            className="absolute -inset-2 rounded-[34%] bg-mint/25"
            style={{ animation: "glow-breathe 1.2s ease-in-out infinite alternate" }}
          />
        )}
        <ChogAvatar image={token.image} seed={seed} name={token.name} size={64} speaking={streaming} />
      </div>

      <div
        className="relative min-h-[8.5rem] min-w-0 flex-1 overflow-hidden rounded-3xl rounded-tl-md p-5 text-ink shadow-[0_24px_50px_-24px_rgba(8,3,18,.9)] sm:p-6"
        style={{ background: surface }}
      >
        {streaming && <span aria-hidden className="shimmer-bar absolute inset-x-0 top-0 h-[3px]" />}
        <span aria-hidden className="absolute -left-1.5 top-6 h-3.5 w-3.5 rotate-45 rounded-[3px]" style={{ background: surface }} />

        <div className="relative flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <p className="text-base font-bold text-violet-deep">{token.name}</p>
          <span className="rounded-full bg-violet-deep/10 px-2.5 py-0.5 text-xs font-semibold text-violet-deep">{archetype}</span>
        </div>

        {text ? (
          <p aria-live="polite" className="relative mt-3 whitespace-pre-wrap break-words text-[1.1rem] leading-relaxed">
            <StreamText text={text} />
          </p>
        ) : streaming ? (
          <p aria-label="Writing" className="relative mt-4 flex items-center gap-1.5 text-violet-deep">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </p>
        ) : (
          <p className="relative mt-3 text-[1.1rem] leading-relaxed text-ink/50">{placeholder}</p>
        )}

        {actions && <div className="relative mt-5 flex flex-wrap gap-2">{actions}</div>}
      </div>
    </motion.div>
  );
}

export function BubbleButton({
  onClick,
  children,
  href,
}: {
  onClick?: () => void;
  children: ReactNode;
  href?: string;
}) {
  const cls =
    "rounded-full bg-ink px-4 py-1.5 text-sm font-semibold text-bone shadow-[0_8px_20px_-10px_rgba(16,8,29,.9)] transition duration-200 hover:-translate-y-0.5 hover:bg-night active:translate-y-0 active:scale-[0.97]";
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls}>
        {children}
      </a>
    );
  }
  return (
    <button onClick={onClick} className={cls}>
      {children}
    </button>
  );
}
