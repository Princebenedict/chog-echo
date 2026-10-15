"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { ChogAvatar } from "./chog-avatar";
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
  const surface = highlight ? "#BDF8DD" : "#EDE5FF";

  return (
    <motion.div
      key={animateKey ?? token.tokenId}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="flex items-start gap-4"
    >
      <div className="relative">
        {streaming && (
          <span
            aria-hidden
            className="absolute -inset-2 rounded-[34%] bg-mint/25"
            style={{ animation: "glow-breathe 1.2s ease-in-out infinite alternate" }}
          />
        )}
        <ChogAvatar image={token.image} seed={seed} name={token.name} size={76} speaking={streaming} idle />
      </div>

      <motion.div
        layout
        className="relative min-w-0 flex-1 rounded-3xl rounded-tl-md p-5 text-ink shadow-[0_24px_50px_-24px_rgba(8,3,18,.9)] sm:p-6"
        style={{ background: surface }}
      >
        <span
          aria-hidden
          className="absolute -left-1.5 top-6 h-3.5 w-3.5 rotate-45 rounded-[3px]"
          style={{ background: surface }}
        />
        <p className="relative mb-2 text-sm font-bold text-violet-deep">{token.name}</p>
        {text ? (
          <p
            aria-live="polite"
            className={`relative whitespace-pre-wrap break-words text-lg leading-snug ${streaming ? "caret" : ""}`}
          >
            {text}
          </p>
        ) : (
          <p className="relative text-lg leading-snug text-ink/50">{placeholder}</p>
        )}
        {actions && <div className="relative mt-4 flex flex-wrap gap-2">{actions}</div>}
      </motion.div>
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
