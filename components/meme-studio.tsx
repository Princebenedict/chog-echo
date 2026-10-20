"use client";

import { useMemo, useRef, useState } from "react";
import { ChogAvatar } from "./chog-avatar";
import { MemeCanvas } from "./meme-canvas";
import { canShareFiles, copyCanvasImage, downloadCanvas, shareCanvasFile } from "@/lib/canvas";
import { MEME_LAYOUTS, isUnlocked, memeImageSrc, unlockHint, type MemeSpec } from "@/lib/meme";
import type { Persona } from "@/lib/personality";
import type { ChogToken } from "@/lib/types";

function Lock() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="7" width="10" height="7" rx="2" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
    </svg>
  );
}

export function MemeStudio({
  token,
  persona,
  spec,
  generating,
  placeholder,
  onChange,
}: {
  token: ChogToken;
  persona: Persona;
  spec: MemeSpec | null;
  generating: boolean;
  placeholder: string;
  onChange: (spec: MemeSpec) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState("");
  const imageSrc = memeImageSrc(token);
  const info = useMemo(() => ({ name: token.name, archetype: persona.archetype, imageSrc }), [token.name, persona.archetype, imageSrc]);
  const filename = `chog-echo-meme-${token.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
  const fileShare = typeof window !== "undefined" && canShareFiles();

  function say(msg: string) {
    setStatus(msg);
    window.setTimeout(() => setStatus((s) => (s === msg ? "" : s)), 2500);
  }
  async function download() {
    if (!canvasRef.current) return;
    await downloadCanvas(canvasRef.current, filename);
    say("Image saved to your downloads.");
  }
  async function copyImage() {
    if (!canvasRef.current) return;
    say((await copyCanvasImage(canvasRef.current)) ? "Image copied to your clipboard." : "Copying images is blocked here. Use Download instead.");
  }
  async function copyCaption() {
    if (!spec) return;
    try {
      await navigator.clipboard.writeText(spec.caption);
      say("Caption copied.");
    } catch {
      say("Copying is blocked here. Select the caption and copy it by hand.");
    }
  }
  async function shareFile() {
    if (!canvasRef.current || !spec) return;
    if (!(await shareCanvasFile(canvasRef.current, filename, spec.caption))) say("Sharing the file is not available here. Use Download instead.");
  }

  const set = (patch: Partial<MemeSpec>) => spec && onChange({ ...spec, ...patch });

  return (
    <section aria-label="Meme Studio" aria-busy={generating} className="glass rounded-3xl p-5 sm:p-6">
      <div role="radiogroup" aria-label="Meme layout" className="flex flex-wrap gap-2">
        {MEME_LAYOUTS.map((layout) => {
          const unlocked = isUnlocked(layout, persona);
          const active = spec?.layout === layout.id;
          return (
            <button
              key={layout.id}
              role="radio"
              aria-checked={active}
              disabled={!unlocked || !spec}
              title={unlocked ? layout.hint : unlockHint(layout)}
              onClick={() => set({ layout: layout.id })}
              className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors duration-200 ${
                active
                  ? "border-mint/60 bg-mint/10 text-bone"
                  : unlocked
                    ? "border-white/10 bg-ink/50 text-lavender enabled:hover:text-bone"
                    : "border-white/5 bg-ink/30 text-lavender/50"
              } disabled:cursor-not-allowed`}
            >
              {!unlocked && <Lock />}
              {layout.label}
            </button>
          );
        })}
      </div>
      {MEME_LAYOUTS.some((l) => !isUnlocked(l, persona)) && (
        <p className="mt-2 text-xs text-lavender">Locked layouts open up when this Chog&apos;s traits are strong enough. Hover a locked layout to see what it needs.</p>
      )}

      <div className="mt-5 grid gap-5 md:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]">
        <div className="relative">
          {spec ? (
            <MemeCanvas spec={spec} info={info} canvasRef={canvasRef} />
          ) : (
            <div className="flex w-full flex-col items-center justify-center gap-4 rounded-2xl bg-ink/60 p-6 text-center" style={{ aspectRatio: "1080 / 1350" }}>
              <ChogAvatar image={token.image} seed={JSON.stringify(token.traits)} name={token.name} size={84} idle={!generating} speaking={generating} />
              {generating ? (
                <p aria-label="Making your meme" className="flex items-center gap-1.5 text-mint">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </p>
              ) : (
                <p className="text-sm leading-relaxed text-lavender">{placeholder}</p>
              )}
            </div>
          )}
          {spec && generating && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-ink/60 backdrop-blur-[2px]">
              <p aria-label="Making your meme" className="flex items-center gap-1.5 text-mint">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </p>
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-4">
          <label className="block text-sm font-semibold text-bone/85">
            Top text
            <input value={spec?.top ?? ""} disabled={!spec} maxLength={90} onChange={(e) => set({ top: e.target.value })} className="field mt-2 py-2.5 text-sm disabled:opacity-50" />
          </label>
          <label className="block text-sm font-semibold text-bone/85">
            Bottom text
            <input value={spec?.bottom ?? ""} disabled={!spec} maxLength={90} onChange={(e) => set({ bottom: e.target.value })} className="field mt-2 py-2.5 text-sm disabled:opacity-50" />
          </label>
          <label className="block text-sm font-semibold text-bone/85">
            Post caption
            <textarea value={spec?.caption ?? ""} disabled={!spec} maxLength={270} rows={3} onChange={(e) => set({ caption: e.target.value })} className="field mt-2 resize-none py-2.5 text-sm disabled:opacity-50" />
          </label>
          {spec?.description && (
            <p className="text-sm leading-relaxed text-lavender">
              <span className="font-semibold text-bone/85">Picture description </span>
              {spec.description}
            </p>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <button onClick={download} disabled={!spec || generating} className="rounded-full bg-mint px-5 py-2.5 text-sm font-bold text-ink shadow-[0_10px_30px_-12px_rgba(85,240,176,.65)] transition duration-200 enabled:hover:-translate-y-0.5 enabled:active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none">
              Download image
            </button>
            <button onClick={copyImage} disabled={!spec || generating} className="rounded-full border border-white/10 bg-grape px-4 py-2.5 text-sm font-semibold transition duration-200 enabled:hover:bg-plum disabled:cursor-not-allowed disabled:opacity-40">
              Copy image
            </button>
            <button onClick={copyCaption} disabled={!spec || generating} className="rounded-full border border-white/10 bg-grape px-4 py-2.5 text-sm font-semibold transition duration-200 enabled:hover:bg-plum disabled:cursor-not-allowed disabled:opacity-40">
              Copy caption
            </button>
            <a
              href={spec ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(spec.caption.slice(0, 270))}` : undefined}
              target="_blank"
              rel="noreferrer"
              aria-disabled={!spec || generating}
              className={`rounded-full border border-white/10 bg-grape px-4 py-2.5 text-sm font-semibold transition duration-200 ${!spec || generating ? "pointer-events-none opacity-40" : "hover:bg-plum"}`}
            >
              Share on X
            </a>
            {fileShare && (
              <button onClick={shareFile} disabled={!spec || generating} className="rounded-full border border-white/10 bg-grape px-4 py-2.5 text-sm font-semibold transition duration-200 enabled:hover:bg-plum disabled:opacity-40">
                Share image
              </button>
            )}
          </div>
          <p role="status" className="min-h-[1.25rem] text-sm text-lavender">{status || (spec ? "X cannot attach a picture from a link, so download the image and add it to your post." : "")}</p>
        </div>
      </div>
    </section>
  );
}
