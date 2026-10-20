import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { SESSION_MS, buildAuthMessage } from "@/lib/auth";
import { getDemoToken } from "@/lib/demo";
import { buildFacts, safeTimeZone } from "@/lib/facts";
import { derivePersona } from "@/lib/personality";
import { buildSystemPrompt, buildUserMessage, sanitizeUserText } from "@/lib/prompt";
import { clientIp, hit } from "@/lib/rate-limit";
import { publicClient } from "@/lib/server/chain";
import { NftError, assertOwner, getChogByTokenId } from "@/lib/server/nft-source";
import type { ChogToken, Kind } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const KINDS: Kind[] = ["post", "reply", "meme", "story"];

function fail(error: string, code: string, status: number) {
  return NextResponse.json({ error, code }, { status });
}

type LlmConfig = {
  provider: string;
  base: string;
  key: string | undefined;
  model: string;
  keyName: string;
};

// Providers: groq (default), openai, or custom (any OpenAI-compatible API).
function llmConfig(): LlmConfig {
  const provider = (process.env.LLM_PROVIDER || "groq").toLowerCase();
  const model = process.env.LLM_MODEL?.trim();

  if (provider === "custom") {
    return {
      provider,
      base: (process.env.LLM_BASE_URL || "").trim().replace(/\/$/, ""),
      key: process.env.LLM_API_KEY,
      model: model || "",
      keyName: "LLM_API_KEY",
    };
  }
  if (provider === "openai") {
    return {
      provider,
      base: "https://api.openai.com/v1",
      key: process.env.OPENAI_API_KEY,
      model: model || "gpt-4o-mini",
      keyName: "OPENAI_API_KEY",
    };
  }
  return {
    provider: "groq",
    base: "https://api.groq.com/openai/v1",
    key: process.env.GROQ_API_KEY,
    model: model || "openai/gpt-oss-120b",
    keyName: "GROQ_API_KEY",
  };
}

async function providerError(res: Response): Promise<string> {
  let detail = "";
  try {
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      detail = json?.error?.message ?? json?.message ?? text;
    } catch {
      detail = text;
    }
  } catch {
    // no body
  }
  detail = detail.replace(/\s+/g, " ").trim().slice(0, 180);
  return detail
    ? `The language model provider returned ${res.status}: ${detail}`
    : `The language model provider returned ${res.status}.`;
}

type Body = {
  mode?: "owner" | "demo";
  tokenId?: string;
  kind?: Kind;
  topic?: string;
  target?: string;
  address?: string;
  signature?: `0x${string}`;
  issuedAt?: number;
  timeZone?: string;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return fail("The request body was not valid JSON.", "BAD_REQUEST", 400);
  }

  const { mode, tokenId, kind } = body;
  if (!kind || !KINDS.includes(kind)) return fail("Pick a valid content type.", "BAD_REQUEST", 400);
  if (!tokenId || typeof tokenId !== "string") return fail("A Chog must be selected.", "BAD_REQUEST", 400);

  const topic = sanitizeUserText(body.topic ?? "", 280);
  const target = sanitizeUserText(body.target ?? "", 600);
  if (kind === "reply" ? target.length < 2 : topic.length < 2) {
    return fail(kind === "reply" ? "Paste the post you want to reply to." : "Give your Chog a topic.", "BAD_REQUEST", 400);
  }

  const ip = clientIp(req);
  let token: ChogToken;

  if (mode === "demo") {
    const limit = hit(`demo:${ip}`, 8, 60 * 60 * 1000);
    if (!limit.ok) {
      return fail(`Sample Chogs are rate limited. Try again in ${Math.ceil(limit.retryIn / 60)} min, or connect a wallet with a Chog.`, "RATE_LIMIT", 429);
    }
    const demo = getDemoToken(tokenId);
    if (!demo) return fail("Unknown sample Chog.", "BAD_REQUEST", 400);
    token = demo;
  } else {
    const { address, signature, issuedAt } = body;
    if (!address || !isAddress(address) || !signature || typeof issuedAt !== "number") {
      return fail("Connect your wallet and sign in to generate with your Chog.", "AUTH", 401);
    }
    const now = Date.now();
    if (issuedAt > now + 5 * 60 * 1000 || now - issuedAt > SESSION_MS) {
      return fail("Your signed session expired. Sign again to continue.", "AUTH", 401);
    }

    let valid = false;
    try {
      valid = await publicClient.verifyMessage({
        address,
        message: buildAuthMessage(address, issuedAt),
        signature,
      });
    } catch {
      valid = false;
    }
    if (!valid) return fail("The signature could not be verified. Sign in again.", "AUTH", 401);

    const limit = hit(`owner:${address.toLowerCase()}`, 40, 60 * 60 * 1000);
    if (!limit.ok) {
      return fail(`Hourly limit reached. Try again in ${Math.ceil(limit.retryIn / 60)} min.`, "RATE_LIMIT", 429);
    }

    try {
      await assertOwner(tokenId, address);
      token = await getChogByTokenId(tokenId);
    } catch (e) {
      if (e instanceof NftError) return fail(e.message, e.code, e.status);
      return fail("Could not verify ownership of that Chog.", "UNKNOWN", 500);
    }
  }

  if (token.traits.length === 0) {
    return fail("This Chog has no readable traits, so there is no voice to build.", "NO_TRAITS", 422);
  }

  const llm = llmConfig();
  if (!llm.key) return fail(`The server is missing ${llm.keyName}.`, "NO_KEY", 503);
  if (!llm.base || !llm.model) {
    return fail("A custom provider needs LLM_BASE_URL and LLM_MODEL in your environment.", "NO_KEY", 503);
  }

  const persona = derivePersona(token.traits);
  const system = buildSystemPrompt(token, persona, kind, buildFacts(safeTimeZone(body.timeZone)));
  const user = buildUserMessage(kind, topic, target);

  // Reasoning models spend part of the token budget thinking, so leave plenty of room.
  const payload: Record<string, unknown> = {
    model: llm.model,
    stream: true,
    temperature: persona.temperature,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  };
  if (llm.provider === "openai") payload.max_completion_tokens = 1500;
  else payload.max_tokens = 1500;
  if (llm.provider === "groq" && /gpt-oss/i.test(llm.model)) payload.reasoning_effort = "low";

  let upstream: Response;
  try {
    upstream = await fetch(`${llm.base}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${llm.key}` },
      body: JSON.stringify(payload),
      signal: req.signal,
    });
  } catch {
    return fail("Could not reach the language model provider.", "UPSTREAM", 502);
  }

  if (!upstream.ok || !upstream.body) {
    return fail(await providerError(upstream), "UPSTREAM", 502);
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const source = upstream.body;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = source.getReader();
      let buffer = "";
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") continue;
            try {
              const json = JSON.parse(data);
              const delta: string | undefined = json.choices?.[0]?.delta?.content;
              if (delta) controller.enqueue(encoder.encode(delta));
            } catch {
              // ignore malformed keep-alive lines
            }
          }
        }
      } catch {
        // upstream aborted: close what we have
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}
