"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { copyCanvasImage, downloadCanvas } from "@/lib/canvas";
import { renderDnaCard, DNA_H, DNA_W } from "@/lib/dna-card";
import { memeImageSrc } from "@/lib/meme";
import type { Persona } from "@/lib/personality";
import type { ChogToken } from "@/lib/types";

export function DnaShare({ token, persona, onClose }: { token: ChogToken; persona: Persona; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [status, setStatus] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    renderDnaCard({ name: token.name, imageSrc: memeImageSrc(token), persona }).then((off) => {
      if (cancelled || !canvasRef.current) return;
      const c = canvasRef.current;
      c.width = off.width;
      c.height = off.height;
      c.getContext("2d")?.drawImage(off, 0, 0);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [token, persona]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const filename = `chog-echo-voice-dna-${token.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;

  async function download() {
    if (!canvasRef.current) return;
    await downloadCanvas(canvasRef.current, filename);
    setStatus("Image saved to your downloads.");
  }
  async function copy() {
    if (!canvasRef.current) return;
    setStatus((await copyCanvasImage(canvasRef.current)) ? "Image copied to your clipboard." : "Copying images is blocked here. Use Download instead.");
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="dna-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm"
        onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Share Voice DNA"
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="glass-solid flex max-h-full w-full max-w-md flex-col gap-4 overflow-y-auto rounded-3xl p-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Share Voice DNA</h2>
            <button ref={closeRef} onClick={onClose} aria-label="Close" className="rounded-full p-2 text-lavender transition hover:bg-white/10 hover:text-bone">
              <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="m3 3 10 10M13 3 3 13" />
              </svg>
            </button>
          </div>
          <div className="relative overflow-hidden rounded-2xl bg-ink/60" style={{ aspectRatio: `${DNA_W} / ${DNA_H}` }}>
            <canvas ref={canvasRef} role="img" aria-label={`Voice DNA card for ${token.name}`} className={`absolute inset-0 h-full w-full transition-opacity duration-300 ${ready ? "opacity-100" : "opacity-0"}`} />
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={download} disabled={!ready} className="rounded-full bg-mint px-5 py-2.5 text-sm font-bold text-ink transition duration-200 enabled:hover:-translate-y-0.5 disabled:opacity-40">
              Download image
            </button>
            <button onClick={copy} disabled={!ready} className="rounded-full border border-white/10 bg-grape px-5 py-2.5 text-sm font-semibold transition duration-200 enabled:hover:bg-plum disabled:opacity-40">
              Copy image
            </button>
          </div>
          <p role="status" className="min-h-[1.25rem] text-sm text-lavender">{status}</p>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
