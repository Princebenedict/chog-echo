"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChogAvatar } from "./chog-avatar";
import { EmptyState } from "./empty-state";
import { FeedMeme } from "./feed-meme";
import { clearFeed, useFeed } from "@/lib/feed-store";
import { KINDS } from "@/lib/types";

function ago(ts: number): string {
  const diff = Math.round((ts - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(diff, "second");
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  return rtf.format(Math.round(diff / 86400), "day");
}

export function FeedList() {
  const { items, ready } = useFeed();

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-5xl font-extrabold tracking-tight sm:text-6xl">Feed</h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-lavender">Everything your Chogs have said on this device.</p>
        </div>
        {items.length > 0 && (
          <button
            onClick={() => clearFeed()}
            className="rounded-full border border-white/10 bg-grape px-5 py-2.5 text-sm font-semibold transition duration-200 hover:bg-plum active:scale-[0.97]"
          >
            Clear feed
          </button>
        )}
      </motion.div>

      <div className="mt-8">
        {!ready ? (
          <div className="grid gap-4 md:grid-cols-2" aria-busy="true" aria-label="Loading feed">
            <div className="h-40 animate-pulse rounded-3xl bg-plum/70" />
            <div className="h-40 animate-pulse rounded-3xl bg-plum/70" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState title="Nothing here yet" body="Generate something in the Studio and it lands here.">
            <Link
              href="/"
              className="rounded-full bg-mint px-6 py-2.5 text-sm font-bold text-ink shadow-[0_10px_30px_-10px_rgba(85,240,176,.65)] transition duration-200 hover:-translate-y-0.5"
            >
              Open the Studio
            </Link>
          </EmptyState>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {items.map((item) => (
              <motion.li
                key={item.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -3 }}
                transition={{ type: "spring", stiffness: 300, damping: 26 }}
                className={`flex gap-4 rounded-3xl p-5 ${
                  item.won
                    ? "glass-solid border-mint/60 shadow-[0_0_0_1px_rgba(85,240,176,.35),0_24px_60px_-24px_rgba(85,240,176,.45)]"
                    : "glass"
                }`}
              >
                <ChogAvatar image={item.image} seed={JSON.stringify(item.traits)} name={item.tokenName} size={60} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">
                    {item.tokenName}
                    {item.demo && <span className="ml-2 font-normal text-lavender">sample</span>}
                    {item.won && <span className="ml-2 text-mint">won the battle</span>}
                  </p>
                  <p className="text-xs text-lavender">
                    {KINDS.find((k) => k.id === item.kind)?.label} on {item.topic || "a pasted post"}, {ago(item.createdAt)}
                  </p>
                  <p className="mt-3 whitespace-pre-wrap break-words leading-snug text-bone/95">{item.text}</p>
                  {item.meme && <FeedMeme item={item} />}
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-8 text-xs text-lavender">
        The feed is stored in this browser only. Swap it for a shared backend to make it public, see the README.
      </p>
    </div>
  );
}
