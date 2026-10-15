import { getAddress, isAddress } from "viem";
import { NETWORK } from "../chains";
import type { ChogToken, Trait } from "../types";
import { erc721Abi, publicClient } from "./chain";

export class NftError extends Error {
  code: string;
  status: number;
  constructor(message: string, code: string, status = 500) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function getContract(): `0x${string}` {
  const raw = process.env.NEXT_PUBLIC_CHOG_CONTRACT;
  if (!raw || !isAddress(raw)) {
    throw new NftError(
      "The Chog contract address is not configured. Set NEXT_PUBLIC_CHOG_CONTRACT in your environment.",
      "NO_CONTRACT",
      503,
    );
  }
  return getAddress(raw);
}

function resolveUri(uri: string): string {
  if (uri.startsWith("ipfs://")) return `https://ipfs.io/ipfs/${uri.slice(7).replace(/^ipfs\//, "")}`;
  if (uri.startsWith("ar://")) return `https://arweave.net/${uri.slice(5)}`;
  return uri;
}

async function fetchMetadata(uri: string): Promise<Record<string, unknown>> {
  if (uri.startsWith("data:application/json")) {
    const comma = uri.indexOf(",");
    const head = uri.slice(0, comma);
    const body = uri.slice(comma + 1);
    const text = head.includes("base64") ? Buffer.from(body, "base64").toString("utf8") : decodeURIComponent(body);
    return JSON.parse(text);
  }
  const res = await fetch(resolveUri(uri), { signal: AbortSignal.timeout(8000), cache: "no-store" });
  if (!res.ok) throw new NftError(`Metadata host returned ${res.status}.`, "METADATA", 502);
  return (await res.json()) as Record<string, unknown>;
}

function parseTraits(meta: Record<string, unknown>): Trait[] {
  const attrs = Array.isArray(meta.attributes) ? (meta.attributes as Record<string, unknown>[]) : [];
  return attrs
    .map((a) => ({
      trait_type: String(a.trait_type ?? a.key ?? "Trait").slice(0, 40),
      value: String(a.value ?? "").slice(0, 60),
    }))
    .filter((t) => t.value.length > 0);
}

const cache = new Map<string, { at: number; token: ChogToken }>();
const TTL = 10 * 60 * 1000;

export async function getChogByTokenId(tokenId: string): Promise<ChogToken> {
  if (!/^\d{1,78}$/.test(tokenId)) throw new NftError("Invalid token id.", "BAD_TOKEN", 400);
  const contract = getContract();
  const key = `${contract}:${tokenId}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.token;

  let uri: string;
  try {
    uri = await publicClient.readContract({
      address: contract,
      abi: erc721Abi,
      functionName: "tokenURI",
      args: [BigInt(tokenId)],
    });
  } catch {
    throw new NftError(`Token #${tokenId} was not found on this contract.`, "NOT_FOUND", 404);
  }

  const meta = await fetchMetadata(uri);
  const image = typeof meta.image === "string" ? resolveUri(meta.image) : null;
  const token: ChogToken = {
    tokenId,
    name: typeof meta.name === "string" && meta.name ? meta.name : `Chog #${tokenId}`,
    image,
    traits: parseTraits(meta),
  };
  cache.set(key, { at: Date.now(), token });
  return token;
}

async function idsFromOpenSea(owner: string, contract: string, apiKey: string): Promise<string[]> {
  const slug = process.env.OPENSEA_CHAIN_SLUG || (NETWORK === "testnet" ? "monad_testnet" : "monad");
  const ids: string[] = [];
  let next: string | undefined;

  for (let page = 0; page < 5; page++) {
    const url = new URL(`https://api.opensea.io/api/v2/chain/${slug}/account/${owner}/nft`);
    url.searchParams.set("limit", "100");
    if (next) url.searchParams.set("next", next);

    const res = await fetch(url, {
      headers: { "x-api-key": apiKey, accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) throw new NftError(`OpenSea returned ${res.status}.`, "OPENSEA", 502);

    const data = (await res.json()) as {
      nfts?: { identifier: string; contract: string }[];
      next?: string | null;
    };
    for (const n of data.nfts ?? []) {
      if (n.contract?.toLowerCase() === contract.toLowerCase()) ids.push(n.identifier);
    }
    if (!data.next) break;
    next = data.next;
  }
  return ids;
}

async function idsFromChain(owner: `0x${string}`, contract: `0x${string}`): Promise<string[]> {
  const balance = await publicClient.readContract({
    address: contract,
    abi: erc721Abi,
    functionName: "balanceOf",
    args: [owner],
  });
  const count = Number(balance > 50n ? 50n : balance);
  if (count === 0) return [];

  try {
    const ids = await Promise.all(
      Array.from({ length: count }, (_, i) =>
        publicClient
          .readContract({
            address: contract,
            abi: erc721Abi,
            functionName: "tokenOfOwnerByIndex",
            args: [owner, BigInt(i)],
          })
          .then((v) => v.toString()),
      ),
    );
    return ids;
  } catch {
    throw new NftError(
      "This contract does not expose token enumeration. Add OPENSEA_API_KEY so owned tokens can be listed.",
      "NO_ENUMERATION",
      501,
    );
  }
}

export async function listOwnedChogs(owner: string): Promise<ChogToken[]> {
  const contract = getContract();
  const checksummed = getAddress(owner);
  const apiKey = process.env.OPENSEA_API_KEY;

  const ids = apiKey
    ? await idsFromOpenSea(checksummed, contract, apiKey)
    : await idsFromChain(checksummed, contract);

  const tokens: ChogToken[] = [];
  for (let i = 0; i < ids.length; i += 4) {
    const batch = await Promise.allSettled(ids.slice(i, i + 4).map((id) => getChogByTokenId(id)));
    for (const r of batch) if (r.status === "fulfilled") tokens.push(r.value);
  }
  return tokens;
}

export async function assertOwner(tokenId: string, owner: string): Promise<void> {
  const contract = getContract();
  let current: string;
  try {
    current = await publicClient.readContract({
      address: contract,
      abi: erc721Abi,
      functionName: "ownerOf",
      args: [BigInt(tokenId)],
    });
  } catch {
    throw new NftError(`Token #${tokenId} was not found on this contract.`, "NOT_FOUND", 404);
  }
  if (current.toLowerCase() !== owner.toLowerCase()) {
    throw new NftError("This wallet does not hold that Chog.", "NOT_OWNER", 403);
  }
}
