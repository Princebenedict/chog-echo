import { NextResponse } from "next/server";
import { NftError, getChogByTokenId } from "@/lib/server/nft-source";

export const dynamic = "force-dynamic";

// Serves a Chog's artwork from our own origin so the browser can draw it into a canvas and export it.
// The image address comes from the token's own metadata, never from the request.
function unsafeHost(host: string): boolean {
  const h = host.toLowerCase();
  return (
    h === "localhost" ||
    h.endsWith(".local") ||
    h.endsWith(".internal") ||
    /^(127\.|10\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h) ||
    h.includes(":")
  );
}

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function GET(req: Request) {
  const tokenId = new URL(req.url).searchParams.get("tokenId") ?? "";
  if (!/^\d{1,78}$/.test(tokenId)) return fail("A valid token id is required.", 400);

  try {
    const token = await getChogByTokenId(tokenId);
    if (!token.image) return fail("This Chog has no artwork.", 404);

    if (token.image.startsWith("data:image/")) {
      const comma = token.image.indexOf(",");
      const head = token.image.slice(5, comma);
      const type = head.split(";")[0];
      const body = head.includes("base64")
        ? Buffer.from(token.image.slice(comma + 1), "base64")
        : Buffer.from(decodeURIComponent(token.image.slice(comma + 1)));
      return new Response(new Uint8Array(body), { headers: { "content-type": type, "cache-control": "public, max-age=3600" } });
    }

    const url = new URL(token.image);
    if (!/^https?:$/.test(url.protocol) || unsafeHost(url.hostname)) return fail("This artwork address is not allowed.", 422);

    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !type.startsWith("image/")) return fail("The artwork could not be loaded.", 502);
    const bytes = await res.arrayBuffer();
    if (bytes.byteLength > 8 * 1024 * 1024) return fail("The artwork is too large.", 413);

    return new Response(bytes, { headers: { "content-type": type, "cache-control": "public, max-age=3600" } });
  } catch (e) {
    if (e instanceof NftError) return fail(e.message, e.status);
    return fail("The artwork could not be loaded.", 502);
  }
}
