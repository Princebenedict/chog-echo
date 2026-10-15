import type { ReactNode } from "react";

// The headline echoes: outlined copies ripple outwards from the solid text like a voice bouncing back.
export function EchoTitle({ children }: { children: ReactNode }) {
  return (
    <span className="echo relative inline-block whitespace-nowrap">
      <span aria-hidden className="echo-ghost">{children}</span>
      <span aria-hidden className="echo-ghost">{children}</span>
      <span aria-hidden className="echo-ghost">{children}</span>
      <span className="relative">{children}</span>
    </span>
  );
}
