"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChogGallery } from "./chog-gallery";
import { DnaShare } from "./dna-share";
import { BubbleButton, EchoBubble } from "./echo-bubble";
import { EmptyState } from "./empty-state";
import { HeroChog } from "./hero-chog";
import { HowItWorks } from "./how-it-works";
import { MemeStudio } from "./meme-studio";
import { VoiceDna } from "./voice-dna";
import { useAmbient } from "@/hooks/use-ambient";
import { errorMessage, useEcho } from "@/hooks/use-echo";
import { useChogs } from "@/hooks/use-chogs";
import { usePreloadTokens } from "@/hooks/use-preload";
import { addFeedItem, newId } from "@/lib/feed-store";
import { MEME_LAYOUTS, isUnlocked, memeImageSrc, parseMeme, type MemeSpec } from "@/lib/meme";
import { derivePersona } from "@/lib/personality";
import { KINDS, type ChogToken, type Kind } from "@/lib/types";

type Status = "idle" | "streaming" | "done" | "error";

const PLACEHOLDERS: Record<Kind, string> = {
  post: "Give me a topic and I will say it my way.",
  reply: "Paste a post and I will answer it.",
  meme: "Give me a topic and I will caption it.",
  story: "Give me a topic and I will tell a short one.",
};

const LAST_KEY = "chog-echo-last-chog";

export function Studio() {
  const chogs = useChogs();
  const { run } = useEcho();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [kind, setKind] = useState<Kind>("post");
  const [topic, setTopic] = useState("");
  const [target, setTarget] = useState("");
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [runId, setRunId] = useState(0);
  const [replyToken, setReplyToken] = useState<ChogToken | null>(null);
  const [meme, setMeme] = useState<{ spec: MemeSpec; token: ChogToken } | null>(null);
  const [showDna, setShowDna] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const token = chogs.tokens.find((t) => t.tokenId === selectedId) ?? chogs.tokens[0] ?? null;
  const persona = useMemo(() => (token ? derivePersona(token.traits) : null), [token]);

  useAmbient([token]);
  usePreloadTokens(chogs.tokens);

  // Come back to the Chog that was selected last time.
  const tokenKey = chogs.tokens.map((t) => t.tokenId).join("|");
  useEffect(() => {
    try {
      const last = localStorage.getItem(LAST_KEY);
      if (last && chogs.tokens.some((t) => t.tokenId === last)) setSelectedId(last);
    } catch {
      // storage blocked: start from the first Chog
    }
    // `tokenKey` stands for the token list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenKey]);

  function select(id: string) {
    setSelectedId(id);
    try {
      localStorage.setItem(LAST_KEY, id);
    } catch {
      // ignore
    }
  }

  const canGenerate =
    !!token && status !== "streaming" && (kind === "reply" ? target.trim().length >= 2 : topic.trim().length >= 2);

  async function generate() {
    if (!token || !canGenerate) return;
    const maker = token;
    setError(null);
    setStatus("streaming");
    setRunId((n) => n + 1);
    setReplyToken(maker);
    if (kind !== "meme") setText("");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const full = await run({
        token: maker,
        kind,
        topic: topic.trim(),
        target: target.trim(),
        onChunk: kind === "meme" ? () => {} : setText,
        signal: controller.signal,
      });

      if (kind === "meme") {
        const parsed = parseMeme(full);
        const makerPersona = derivePersona(maker.traits);
        const keep = meme && MEME_LAYOUTS.find((l) => l.id === meme.spec.layout);
        const layout = keep && isUnlocked(keep, makerPersona) ? keep.id : "classic";
        const spec: MemeSpec = { layout, ...parsed };
        setMeme({ spec, token: maker });
        addFeedItem({
          id: newId(),
          createdAt: Date.now(),
          tokenId: maker.tokenId,
          tokenName: maker.name,
          image: maker.image,
          traits: maker.traits,
          kind,
          topic: topic.trim(),
          text: spec.caption,
          demo: !!maker.isDemo,
          meme: spec,
          imageSrc: memeImageSrc(maker),
        });
      } else {
        addFeedItem({
          id: newId(),
          createdAt: Date.now(),
          tokenId: maker.tokenId,
          tokenName: maker.name,
          image: maker.image,
          traits: maker.traits,
          kind,
          topic: topic.trim(),
          target: kind === "reply" ? target.trim() : undefined,
          text: full,
          demo: !!maker.isDemo,
        });
      }
      setStatus("done");
    } catch (e) {
      if (controller.signal.aborted) {
        setStatus("idle");
        return;
      }
      setError(errorMessage(e));
      setStatus("error");
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      setError("Copy is blocked in this browser. Select the text and copy it by hand.");
    }
  }

  const streaming = status === "streaming";
  const bubbleToken = text && replyToken ? replyToken : token;
  const memeToken = meme?.token ?? token;
  const memePersona = useMemo(() => (memeToken ? derivePersona(memeToken.traits) : null), [memeToken]);

  return (
    <div>
      <section className="grid items-center gap-6 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:gap-10">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
          <h1 className="font-display text-5xl font-extrabold leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">
            Your Chog does
            <br />
            <span className="inline-block bg-gradient-to-r from-bone via-electric to-mint bg-clip-text pb-[0.1em] text-transparent">
              the talking.
            </span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-lavender">
            Every trait on your NFT changes how it writes. No Chog in your wallet, no echo.
          </p>
        </motion.div>
        <HeroChog token={token} />
      </section>

      {chogs.showingDemo && (
        <div className="glass mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm">
          <p className="flex items-center gap-2.5 text-bone/90">
            <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-mint shadow-[0_0_10px_rgba(85,240,176,.8)]" />
            You are using sample characters. They show how the voice engine works but are not Chog NFTs.
          </p>
          {chogs.isConnected && (
            <button onClick={() => chogs.setPreferDemo(false)} className="font-semibold text-mint underline underline-offset-4">
              Back to my wallet
            </button>
          )}
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="min-w-0 space-y-5">
          {chogs.loading && (
            <div className="space-y-3" aria-busy="true" aria-label="Loading your Chogs">
              <div className="h-28 animate-pulse rounded-3xl bg-plum/70" />
              <div className="h-64 animate-pulse rounded-3xl bg-plum/70" />
            </div>
          )}

          {chogs.error && (
            <EmptyState title="Could not load your Chogs" body={chogs.error}>
              <button onClick={() => chogs.refetch()} className="rounded-full bg-mint px-5 py-2 text-sm font-bold text-ink">
                Try again
              </button>
              <button onClick={() => chogs.setPreferDemo(true)} className="rounded-full bg-grape px-5 py-2 text-sm font-semibold">
                Use sample Chogs
              </button>
            </EmptyState>
          )}

          {chogs.emptyOwned && (
            <EmptyState
              title="No Chog in this wallet"
              body="Echo only speaks through a real Chog. Get one, or try a sample character to see how the voice engine works."
            >
              <a href="https://chog.xyz" target="_blank" rel="noreferrer" className="rounded-full bg-mint px-5 py-2 text-sm font-bold text-ink">
                Find a Chog
              </a>
              <button onClick={() => chogs.setPreferDemo(true)} className="rounded-full bg-grape px-5 py-2 text-sm font-semibold">
                Try a sample Chog
              </button>
            </EmptyState>
          )}

          {token && persona && (
            <>
              <ChogGallery tokens={chogs.tokens} selectedId={token.tokenId} onSelect={select} />
              <VoiceDna persona={persona} tokenKey={token.tokenId} onShare={() => setShowDna(true)} />
            </>
          )}
        </div>

        <div className="min-w-0 space-y-6">
          {token && persona ? (
            <>
              <section aria-label="Composer" aria-busy={streaming} className="glass rounded-3xl p-5 sm:p-6">
                <div role="tablist" aria-label="Content type" className="flex gap-1 rounded-full bg-ink/60 p-1 ring-1 ring-inset ring-white/5">
                  {KINDS.map((k) => {
                    const active = k.id === kind;
                    return (
                      <button
                        key={k.id}
                        role="tab"
                        aria-selected={active}
                        title={k.hint}
                        onClick={() => setKind(k.id)}
                        className={`relative flex-1 rounded-full px-3 py-2 text-sm font-semibold transition-colors duration-200 ${
                          active ? "text-bone" : "text-lavender hover:text-bone"
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="kind-pill"
                            className="absolute inset-0 rounded-full bg-violet shadow-[0_8px_22px_-8px_rgba(135,84,246,.9)]"
                            transition={{ type: "spring", stiffness: 420, damping: 34 }}
                          />
                        )}
                        <span className="relative">{k.label}</span>
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence initial={false}>
                  {kind === "reply" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <label htmlFor="target" className="mt-5 block text-sm font-semibold text-bone/85">
                        Post to reply to
                      </label>
                      <textarea
                        id="target"
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        maxLength={600}
                        rows={3}
                        placeholder="Paste the post here"
                        className="field mt-2 resize-none"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <label htmlFor="topic" className="mt-5 block text-sm font-semibold text-bone/85">
                  {kind === "reply" ? "Angle for the reply (optional)" : "Topic"}
                </label>
                <input
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") generate();
                  }}
                  maxLength={280}
                  placeholder={kind === "reply" ? "Agree, push back, joke about it" : "Monday mornings, gas fees, a new mint"}
                  className="field mt-2"
                />

                <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
                  {streaming ? (
                    <button
                      onClick={stop}
                      className="flex items-center gap-3 rounded-full border border-electric/40 bg-grape px-6 py-3 font-bold text-bone transition duration-200 hover:bg-plum active:scale-[0.97]"
                    >
                      Stop
                      <span aria-hidden className="flex items-center gap-1 text-mint">
                        <span className="dot" />
                        <span className="dot" />
                        <span className="dot" />
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={generate}
                      disabled={!canGenerate}
                      className="rounded-full bg-mint px-7 py-3 font-bold text-ink shadow-[0_10px_30px_-10px_rgba(85,240,176,.65)] transition duration-200 enabled:hover:-translate-y-0.5 enabled:hover:shadow-[0_14px_38px_-8px_rgba(85,240,176,.85)] enabled:active:translate-y-0 enabled:active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                    >
                      Echo
                    </button>
                  )}
                  {!token.isDemo && (
                    <p className="text-xs text-lavender">First echo asks your wallet for a free signature to prove you hold this Chog.</p>
                  )}
                </div>

                {error && (
                  <p role="alert" className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {error}
                  </p>
                )}
              </section>

              {kind === "meme" && memePersona && memeToken ? (
                <MemeStudio
                  token={memeToken}
                  persona={memePersona}
                  spec={meme?.spec ?? null}
                  generating={streaming}
                  placeholder={PLACEHOLDERS.meme}
                  onChange={(spec) => setMeme((m) => (m ? { ...m, spec } : m))}
                />
              ) : (
                bubbleToken && (
                  <EchoBubble
                    token={bubbleToken}
                    text={text}
                    streaming={streaming}
                    placeholder={PLACEHOLDERS[kind]}
                    animateKey={runId}
                    actions={
                      status === "done" && text ? (
                        <>
                          <BubbleButton onClick={copy}>Copy</BubbleButton>
                          <BubbleButton href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text.slice(0, 270))}`}>
                            Share on X
                          </BubbleButton>
                          <BubbleButton onClick={generate}>Echo again</BubbleButton>
                          <Link href="/feed" className="rounded-full px-3 py-1.5 text-sm font-semibold text-violet-deep underline underline-offset-4">
                            Saved to feed
                          </Link>
                        </>
                      ) : undefined
                    }
                  />
                )
              )}
            </>
          ) : (
            !chogs.loading &&
            !chogs.error &&
            !chogs.emptyOwned && (
              <EmptyState title="Pick a Chog to start" body="Connect a wallet that holds a Chog, or use the sample characters." />
            )
          )}
        </div>
      </div>

      <HowItWorks />

      {showDna && token && persona && <DnaShare token={token} persona={persona} onClose={() => setShowDna(false)} />}
    </div>
  );
}
