"use client";

import { useCallback, useRef } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { SESSION_MS, buildAuthMessage } from "@/lib/auth";
import { EchoError, streamGenerate } from "@/lib/stream";
import type { ChogToken, Kind } from "@/lib/types";

type Auth = { signature: `0x${string}`; issuedAt: number };

export type EchoArgs = {
  token: ChogToken;
  kind: Kind;
  topic: string;
  target?: string;
  onChunk: (text: string) => void;
  signal?: AbortSignal;
};

export function useEcho() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const pending = useRef<Promise<Auth> | null>(null);

  const ensureAuth = useCallback(async (): Promise<Auth> => {
    if (!address) throw new EchoError("Connect your wallet first.", "NO_WALLET");
    const key = `chog-echo-auth:${address.toLowerCase()}`;

    try {
      const raw = sessionStorage.getItem(key);
      if (raw) {
        const cached = JSON.parse(raw) as Auth;
        if (Date.now() - cached.issuedAt < SESSION_MS - 60_000) return cached;
      }
    } catch {
      // ignore unreadable cache
    }

    if (pending.current) return pending.current;

    pending.current = (async () => {
      const issuedAt = Date.now();
      try {
        const signature = await signMessageAsync({ message: buildAuthMessage(address, issuedAt) });
        const auth = { signature, issuedAt };
        try {
          sessionStorage.setItem(key, JSON.stringify(auth));
        } catch {
          // session storage blocked: sign again next time
        }
        return auth;
      } catch (e) {
        const msg = e instanceof Error ? e.message.toLowerCase() : "";
        if (msg.includes("rejected") || msg.includes("denied")) {
          throw new EchoError("You cancelled the signature request. Sign to prove you hold a Chog.", "SIG_REJECTED");
        }
        throw new EchoError("The wallet could not sign the request.", "SIG_FAILED");
      }
    })().finally(() => {
      pending.current = null;
    });

    return pending.current;
  }, [address, signMessageAsync]);

  const run = useCallback(
    async ({ token, kind, topic, target, onChunk, signal }: EchoArgs) => {
      const base = { kind, topic, target, tokenId: token.tokenId };
      if (token.isDemo) {
        return streamGenerate({ ...base, mode: "demo" }, onChunk, signal);
      }
      const auth = await ensureAuth();
      return streamGenerate(
        { ...base, mode: "owner", address, signature: auth.signature, issuedAt: auth.issuedAt },
        onChunk,
        signal,
      );
    },
    [address, ensureAuth],
  );

  return { run, ensureAuth };
}

export function errorMessage(e: unknown): string {
  if (e instanceof EchoError) return e.message;
  if (e instanceof Error) return e.message;
  return "Something went wrong. Try again.";
}
