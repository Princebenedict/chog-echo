"use client";

import { motion } from "framer-motion";
import { hash } from "@/lib/personality";

const FILLS = ["#8b5cf6", "#5ef2a0", "#c084fc", "#34d399", "#a78bfa", "#86efac"];

type Props = {
  image: string | null;
  seed: string;
  name: string;
  size?: number;
  speaking?: boolean;
  idle?: boolean;
  className?: string;
};

export function ChogAvatar({ image, seed, name, size = 96, speaking = false, idle = false, className = "" }: Props) {
  const h = hash(seed);
  const fill = FILLS[h % FILLS.length];
  const mouth = h % 3;

  return (
    <motion.div
      className={`relative shrink-0 ${className}`}
      style={{ width: size, height: size }}
      animate={
        speaking
          ? { rotate: [-2, 2, -2], scale: [1, 1.04, 1], y: 0 }
          : idle
            ? { rotate: 0, scale: 1, y: [0, -4, 0] }
            : { rotate: 0, scale: 1, y: 0 }
      }
      transition={
        speaking
          ? { duration: 0.7, repeat: Infinity, ease: "easeInOut" }
          : idle
            ? { duration: 2.4 + (h % 7) / 10, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.25 }
      }
    >
      {speaking && (
        <span aria-hidden className="absolute inset-0 rounded-[28%] ring-2 ring-mint/70 animate-ping motion-reduce:animate-none" />
      )}
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={name} className="h-full w-full rounded-[28%] bg-plum object-cover shadow-lg shadow-black/30 ring-1 ring-white/15" />
      ) : (
        <svg viewBox="0 0 100 100" role="img" aria-label={`${name}, generated placeholder art`} className="h-full w-full">
          <circle cx="24" cy="22" r="11" fill={fill} />
          <circle cx="76" cy="22" r="11" fill={fill} />
          <rect x="6" y="14" width="88" height="80" rx="28" fill={fill} />
          <circle cx="36" cy="48" r="6" fill="#120a22" />
          <circle cx="64" cy="48" r="6" fill="#120a22" />
          <circle cx="38" cy="46" r="2" fill="#f4efff" />
          <circle cx="66" cy="46" r="2" fill="#f4efff" />
          {mouth === 0 && <path d="M38 68 Q50 80 62 68" stroke="#120a22" strokeWidth="4" fill="none" strokeLinecap="round" />}
          {mouth === 1 && <rect x="40" y="68" width="20" height="5" rx="2.5" fill="#120a22" />}
          {mouth === 2 && <ellipse cx="50" cy="71" rx="8" ry="6" fill="#120a22" />}
        </svg>
      )}
    </motion.div>
  );
}
