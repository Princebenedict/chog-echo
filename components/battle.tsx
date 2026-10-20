"use client";

import { motion } from "framer-motion";
import { useEffect, useId, useRef, useState } from "react";
import { ArenaStage } from "./arena-stage";
import { ChogAvatar } from "./chog-avatar";
import { BubbleButton, EchoBubble } from "./echo-bubble";
import { EmptyState } from "./empty-state";
import { useAmbient } from "@/hooks/use-ambient";
import { errorMessage, useEcho } from "@/hooks/use-echo";
import { useChogs } from "@/hooks/use-chogs";
import { DEMO_TOKENS } from "@/lib/demo";
import { addFeedItem, newId, updateFeedItem } from "@/lib/feed-store";
import type { ChogToken } from "@/lib/types";

type Side = { text: string; streaming: boolean; error: string | null; feedId: string | null };
const EMPTY: Side = { text: "", streaming: false, error: null, feedId: null };

function Bolt({ className = "" }: { className?: string }) {
  const id = useId();
  return (
    <svg
      viewBox="0 0 48 64"
      aria-hidden
      className={className}
      style={{ animation: "bolt-pulse 2.4s ease-in-out infinite" }}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#A46CFF" />
          <stop offset="1" stopColor="#55F0B0" />
        </linearGradient>
      </defs>
      <path d="M29 2 7 36h14l-4 26 24-36H26z" fill={`url(#${id})`} />
    </svg>
  );
}

function Corner({
  label,
  slot,
  token,
  value,
  onChange,
  owned,
}: {
  label: string;
  slot: "a" | "b";
  token: ChogToken;
  value: string;
  onChange: (id: string) => void;
  owned: ChogToken[];
}) {
  const channels = slot === "a" ? "var(--amb-a-r) var(--amb-a-g) var(--amb-a-b)" : "var(--amb-b-r) var(--amb-b-g) var(--amb-b-b)";

  return (
    <div className="glass-solid relative overflow-hidden rounded-3xl p-5">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-1/2 left-0 h-[140%] w-[70%]"
        style={{ background: `radial-gradient(closest-side, rgb(${channels} / .34), transparent 75%)` }}
      />
      <div className="relative flex items-center gap-4">
        <motion.div key={token.tokenId} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
          <ChogAvatar image={token.image} seed={JSON.stringify(token.traits)} name={token.name} size={92} idle />
        </motion.div>
        <label className="block min-w-0 flex-1 text-sm font-semibold text-bone/85">
          {label}
          <select value={value} onChange={(e) => onChange(e.target.value)} className="field mt-2">
            {owned.length > 0 && (
              <optgroup label="Your Chogs">
                {owned.map((t) => (
                  <option key={t.tokenId} value={t.tokenId}>
                    {t.name}
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label="Sample characters">
              {DEMO_TOKENS.map((t) => (
                <option key={t.tokenId} value={t.tokenId}>
                  {t.name}
                </option>
              ))}
            </optgroup>
          </select>
        </label>
      </div>
    </div>
  );
}

export function Battle() {
  const { owned, isConnected } = useChogs();
  const { run, ensureAuth } = useEcho();

  const pool = [...owned, ...DEMO_TOKENS];
  const [aId, setAId] = useState(DEMO_TOKENS[0].tokenId);
  const [bId, setBId] = useState(DEMO_TOKENS[1].tokenId);
  const [topic, setTopic] = useState("");
  const [a, setA] = useState<Side>(EMPTY);
  const [b, setB] = useState<Side>(EMPTY);
  const [winner, setWinner] = useState<"a" | "b" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [round, setRound] = useState(0);
  const [fighters, setFighters] = useState<{ a: ChogToken; b: ChogToken } | null>(null);
  const [ra, setRa] = useState<Side>(EMPTY);
  const [rb, setRb] = useState<Side>(EMPTY);
  const [threaded, setThreaded] = useState(false);
  const battleId = useRef("");
  const seeded = useRef(false);

  useEffect(() => {
    if (seeded.current || owned.length === 0) return;
    seeded.current = true;
    setAId(owned[0].tokenId);
    setBId(owned[1]?.tokenId ?? DEMO_TOKENS[0].tokenId);
  }, [owned]);

  const tokenA = pool.find((t) => t.tokenId === aId) ?? DEMO_TOKENS[0];
  const tokenB = pool.find((t) => t.tokenId === bId) ?? DEMO_TOKENS[1];
  const busy = a.streaming || b.streaming;
  const done = !busy && a.text && b.text;
  const sameToken = tokenA.tokenId === tokenB.tokenId;

  useAmbient([tokenA, tokenB]);

  async function fight() {
    if (busy || topic.trim().length < 2 || sameToken) return;
    setError(null);
    setWinner(null);
    setRound((n) => n + 1);
    setFighters({ a: tokenA, b: tokenB });
    setRa(EMPTY);
    setRb(EMPTY);
    setThreaded(false);
    setA({ ...EMPTY, streaming: true });
    setB({ ...EMPTY, streaming: true });
    battleId.current = newId();

    try {
      if (!tokenA.isDemo || !tokenB.isDemo) {
        if (!isConnected) throw new Error("Connect your wallet to battle with your own Chog.");
        await ensureAuth();
      }
    } catch (e) {
      setError(errorMessage(e));
      setA(EMPTY);
      setB(EMPTY);
      return;
    }

    const side = async (
      token: ChogToken,
      set: (fn: (s: Side) => Side) => void,
    ) => {
      try {
        const full = await run({
          token,
          kind: "post",
          topic: topic.trim(),
          onChunk: (t) => set((s) => ({ ...s, text: t })),
        });
        const id = newId();
        addFeedItem({
          id,
          createdAt: Date.now(),
          tokenId: token.tokenId,
          tokenName: token.name,
          image: token.image,
          traits: token.traits,
          kind: "post",
          topic: topic.trim(),
          text: full,
          demo: !!token.isDemo,
          battleId: battleId.current,
        });
        set((s) => ({ ...s, streaming: false, feedId: id }));
      } catch (e) {
        set((s) => ({ ...s, streaming: false, error: errorMessage(e) }));
      }
    };

    await Promise.all([side(tokenA, setA), side(tokenB, setB)]);
  }

  function vote(w: "a" | "b") {
    setWinner(w);
    const winnerSide = w === "a" ? a : b;
    if (winnerSide.feedId) updateFeedItem(winnerSide.feedId, { won: true });
  }

  async function thread() {
    if (!fighters || !done || ra.streaming || rb.streaming) return;
    setError(null);
    setThreaded(true);
    setRa({ ...EMPTY, streaming: true });
    setRb({ ...EMPTY, streaming: true });
    try {
      if (!fighters.a.isDemo || !fighters.b.isDemo) await ensureAuth();
    } catch (e) {
      setError(errorMessage(e));
      setThreaded(false);
      setRa(EMPTY);
      setRb(EMPTY);
      return;
    }

    const reply = async (token: ChogToken, target: string, set: (fn: (s: Side) => Side) => void) => {
      try {
        const full = await run({
          token,
          kind: "reply",
          topic: "",
          target,
          onChunk: (t) => set((s) => ({ ...s, text: t })),
        });
        addFeedItem({
          id: newId(),
          createdAt: Date.now(),
          tokenId: token.tokenId,
          tokenName: token.name,
          image: token.image,
          traits: token.traits,
          kind: "reply",
          topic: topic.trim(),
          target,
          text: full,
          demo: !!token.isDemo,
          battleId: battleId.current,
        });
        set((s) => ({ ...s, streaming: false }));
      } catch (e) {
        set((s) => ({ ...s, streaming: false, error: errorMessage(e) }));
      }
    };

    await Promise.all([reply(fighters.a, b.text, setRa), reply(fighters.b, a.text, setRb)]);
  }

  function reset() {
    setFighters(null);
    setRa(EMPTY);
    setRb(EMPTY);
    setThreaded(false);
    setA(EMPTY);
    setB(EMPTY);
    setWinner(null);
    setError(null);
  }

  const arena = [
    { key: "a" as const, label: "Corner A", token: fighters?.a ?? tokenA, other: fighters?.b ?? tokenB, side: a, reply: ra },
    { key: "b" as const, label: "Corner B", token: fighters?.b ?? tokenB, other: fighters?.a ?? tokenA, side: b, reply: rb },
  ];

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: "easeOut" }}>
        <h1 className="font-display text-5xl font-extrabold tracking-tight sm:text-6xl">Echo Battle</h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-lavender">
          Two Chogs, one topic, one winner. Same prompt, different traits. You are the judge.
        </p>
      </motion.div>

      <section aria-label="Battle setup" className="glass mt-8 rounded-[2rem] p-5 sm:p-6">
        <div className="grid items-center gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <Corner label="Corner A" slot="a" token={tokenA} value={aId} onChange={setAId} owned={owned} />
          <div className="flex justify-center">
            <Bolt className="h-12 w-9 md:h-16 md:w-12" />
          </div>
          <Corner label="Corner B" slot="b" token={tokenB} value={bId} onChange={setBId} owned={owned} />
        </div>

        <label htmlFor="battle-topic" className="mt-6 block text-sm font-semibold text-bone/85">
          Topic
        </label>
        <input
          id="battle-topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") fight();
          }}
          maxLength={280}
          placeholder="Is Monday a personality"
          className="field mt-2"
        />

        {sameToken && <p className="mt-3 text-sm text-lavender">Pick two different Chogs for a fair fight.</p>}
        {error && (
          <p role="alert" className="mt-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            onClick={fight}
            disabled={busy || topic.trim().length < 2 || sameToken}
            className="rounded-full bg-mint px-7 py-3 font-bold text-ink shadow-[0_10px_30px_-10px_rgba(85,240,176,.65)] transition duration-200 enabled:hover:-translate-y-0.5 enabled:hover:shadow-[0_14px_38px_-8px_rgba(85,240,176,.85)] enabled:active:translate-y-0 enabled:active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            Start battle
          </button>
          {(a.text || b.text) && !busy && (
            <button onClick={reset} className="rounded-full border border-white/10 bg-grape px-5 py-3 font-semibold transition duration-200 hover:bg-plum active:scale-[0.97]">
              New round
            </button>
          )}
          {busy && (
            <span aria-hidden className="flex items-center gap-1 text-mint">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </span>
          )}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-lavender">
          Battles run on this device, with both pieces judged by whoever is holding it. A shared online arena needs a backend, see the README.
        </p>
      </section>

      {a.text || b.text || busy || a.error || b.error ? (
        <div className="mt-8 grid gap-6 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-start">
          {fighters && (
            <div className="md:col-span-3">
              <ArenaStage
                a={fighters.a}
                b={fighters.b}
                clashing={busy || ra.streaming || rb.streaming}
                winner={winner}
                finished={!!done}
              />
            </div>
          )}
          {arena.map(({ key, label, token, other, side, reply }, index) => (
            <motion.div
              key={`${key}-${round}`}
              initial={{ opacity: 0, x: key === "a" ? -48 : 48 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 180, damping: 22, delay: 0.05 }}
              className={`glass-solid space-y-4 rounded-3xl p-5 ${index === 1 ? "md:order-3" : "md:order-1"} ${
                winner === key ? "border-mint/60 shadow-[0_0_0_1px_rgba(85,240,176,.4),0_24px_60px_-24px_rgba(85,240,176,.5)]" : ""
              }`}
            >
              <p
                className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${
                  key === "a" ? "border-mint/30 bg-mint/10 text-mint" : "border-electric/30 bg-electric/10 text-electric"
                }`}
              >
                {label}
              </p>
              <EchoBubble
                token={token}
                text={side.text}
                streaming={side.streaming}
                placeholder="Warming up"
                highlight={winner === key}
                animateKey={`${key}-${round}`}
                actions={done && !winner ? <BubbleButton onClick={() => vote(key)}>This one wins</BubbleButton> : undefined}
              />
              {side.error && (
                <p role="alert" className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {side.error}
                </p>
              )}
              {winner === key && (
                <p className="font-display text-lg font-bold text-mint">Winner</p>
              )}
              {threaded && (
                <div className="space-y-2 border-t border-white/10 pt-4">
                  <p className="text-sm text-lavender">Replying to {other.name}</p>
                  <EchoBubble
                    token={token}
                    text={reply.text}
                    streaming={reply.streaming}
                    placeholder="Warming up"
                    animateKey={`${key}-reply-${round}`}
                  />
                  {reply.error && (
                    <p role="alert" className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {reply.error}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          ))}
          <div className="hidden self-center md:order-2 md:flex">
            <Bolt className="h-14 w-10" />
          </div>
          {done && !threaded && (
            <div className="flex justify-center md:order-4 md:col-span-3">
              <button
                onClick={thread}
                className="rounded-full border border-electric/40 bg-grape px-6 py-3 font-semibold transition duration-200 hover:-translate-y-0.5 hover:bg-plum active:scale-[0.97]"
              >
                Let them reply
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState title="No battle yet" body="Pick two corners, set a topic, and start. Both Chogs answer at the same time." />
        </div>
      )}
    </div>
  );
}
