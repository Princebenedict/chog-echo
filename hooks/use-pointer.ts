"use client";

import { useEffect } from "react";
import { useMotionValue, useSpring } from "framer-motion";

// Pointer position normalised to -1..1 on both axes, smoothed with a spring.
export function usePointer() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      x.set((e.clientX / window.innerWidth - 0.5) * 2);
      y.set((e.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [x, y]);

  return {
    x: useSpring(x, { stiffness: 60, damping: 18 }),
    y: useSpring(y, { stiffness: 60, damping: 18 }),
  };
}
