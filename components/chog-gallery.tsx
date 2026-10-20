"use client";

import { useMemo, useRef, useState } from "react";
import type { ChogToken } from "@/lib/types";

const PAGE = 12;

// The selection page. Cards are a fixed size, selection only changes colour and shadow (no movement),
// so choosing a Chog never shifts the layout.
export function ChogGallery({
  tokens,
  selectedId,
  onSelect,
}: {
  tokens: ChogToken[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const gridRef = useRef<HTMLDivElement>(null);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? tokens.filter((t) => t.name.toLowerCase().includes(q) || t.tokenId.includes(q)) : tokens;
  }, [tokens, query]);
  const visible = filtered.slice(0, limit);
  const selectedVisible = visible.some((t) => t.tokenId === selectedId);

  function onKeyDown(e: React.KeyboardEvent) {
    const keys = ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"];
    if (!keys.includes(e.key) || visible.length === 0) return;
    e.preventDefault();
    const cols = Math.max(1, getComputedStyle(gridRef.current as Element).gridTemplateColumns.split(" ").length);
    const current = Math.max(0, visible.findIndex((t) => t.tokenId === selectedId));
    let next = current;
    if (e.key === "ArrowRight") next = Math.min(visible.length - 1, current + 1);
    if (e.key === "ArrowLeft") next = Math.max(0, current - 1);
    if (e.key === "ArrowDown") next = Math.min(visible.length - 1, current + cols);
    if (e.key === "ArrowUp") next = Math.max(0, current - cols);
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = visible.length - 1;
    onSelect(visible[next].tokenId);
    refs.current[next]?.focus();
  }

  return (
    <section aria-label="Choose a Chog" className="glass rounded-3xl p-4 sm:p-5">
      {tokens.length > 8 && (
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setLimit(PAGE);
          }}
          placeholder="Search by name or number"
          aria-label="Search your Chogs"
          className="field mb-4 py-2.5 text-sm"
        />
      )}

      <div ref={gridRef} role="radiogroup" aria-label="Choose a Chog" onKeyDown={onKeyDown} className="grid grid-cols-3 gap-2">
        {visible.map((t, i) => {
          const selected = t.tokenId === selectedId;
          return (
            <button
              key={t.tokenId}
              ref={(el) => {
                refs.current[i] = el;
              }}
              role="radio"
              aria-checked={selected}
              tabIndex={selected || (!selectedVisible && i === 0) ? 0 : -1}
              onClick={() => onSelect(t.tokenId)}
              className={`group rounded-2xl p-1.5 text-left transition-[background-color,box-shadow] duration-200 ${
                selected
                  ? "bg-mint/10 shadow-[0_0_0_1.5px_rgba(85,240,176,.7),0_14px_34px_-14px_rgba(85,240,176,.5)]"
                  : "shadow-[0_0_0_1.5px_rgba(255,255,255,0)] hover:bg-white/[0.06] hover:shadow-[0_0_0_1.5px_rgba(190,145,255,.25)]"
              }`}
            >
              <span className="relative block aspect-square overflow-hidden rounded-xl bg-plum">
                {t.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={t.image}
                    alt=""
                    decoding="async"
                    draggable={false}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-violet to-grape font-display text-3xl font-extrabold">
                    {t.name.trim()[0]?.toUpperCase() ?? "C"}
                  </span>
                )}
                {selected && (
                  <span aria-hidden className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-mint text-ink">
                    <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2.5 6.5 5 9l4.5-5.5" />
                    </svg>
                  </span>
                )}
              </span>
              <span className={`mt-2 block truncate px-0.5 text-xs font-semibold ${selected ? "text-bone" : "text-lavender group-hover:text-bone"}`}>
                {t.name}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && <p className="py-6 text-center text-sm text-lavender">No Chog matches that search.</p>}

      {filtered.length > limit && (
        <button
          onClick={() => setLimit((n) => n + PAGE)}
          className="mt-3 w-full rounded-full border border-white/10 bg-ink/50 py-2 text-sm font-semibold text-lavender transition duration-200 hover:bg-ink/80 hover:text-bone"
        >
          Show more
        </button>
      )}
    </section>
  );
}
