# Chog Echo

Your Chog NFT is the voice. Its traits decide how it writes posts, replies, memes and short stories. No Chog in the wallet, no generation.

Built for Chogathon 2026: the NFT is the engine, not a login badge. Remove the NFT and there is no voice to build.

## Stack

Next.js 14 (App Router), TypeScript, Tailwind CSS, wagmi + RainbowKit + viem, Framer Motion. LLM through Groq or OpenAI (server side only).

## Setup

1. Install dependencies: `npm install`
2. Copy the env file: `cp .env.example .env.local`
3. Fill in `.env.local` (see the table below).
4. Start the dev server: `npm run dev`
5. Open http://localhost:3000

## Environment variables

| Name | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_WC_PROJECT_ID` | Yes | Free project id from cloud.walletconnect.com |
| `NEXT_PUBLIC_CHOG_CONTRACT` | Yes for real Chogs | Chog NFT contract on Monad. Copy it from official Chog channels and double check it. |
| `NEXT_PUBLIC_NETWORK` | No | `mainnet` (chain id 143, default) or `testnet` (chain id 10143) |
| `GROQ_API_KEY` | Yes if using Groq | Default provider |
| `OPENAI_API_KEY` | Yes if `LLM_PROVIDER=openai` | |
| `LLM_PROVIDER` | No | `groq` (default) or `openai` |
| `LLM_MODEL` | No | Defaults: `llama-3.3-70b-versatile`, `gpt-4o-mini` |
| `OPENSEA_API_KEY` | Recommended | Lists a wallet's Chogs. Without it the app falls back to ERC-721 enumeration, which only works if the contract supports it. |
| `OPENSEA_CHAIN_SLUG` | No | Defaults to `monad` or `monad_testnet` |
| `MONAD_RPC_URL` | No | Overrides the public RPC |

Demo mode (sample characters, no wallet) works with only the LLM key set.

## How the gate works

1. The wallet signs a free message once per session (24 hours). No transaction, no gas.
2. The server verifies the signature, then calls `ownerOf(tokenId)` on the Chog contract.
3. The server reads the traits itself from the token's `tokenURI`. The browser never sends traits, so they cannot be spoofed.
4. The system prompt is built from those traits and sent to the LLM. The reply streams back to the browser.

## How traits become a voice

All logic lives in `lib/personality.ts`.

1. Each trait type is sorted into a category (background, headwear, eyes, mouth, outfit, item, other).
2. A keyword rule for that category matches the trait value and moves five axes: confidence, sarcasm, chaos, warmth, brevity.
3. Background rules weigh most on brevity, so the backdrop changes how long the Chog talks.
4. A trait with no keyword match still counts. A hash of the trait seeds a small quirk, so every trait always changes the voice. The Voice DNA panel marks these honestly.
5. The five axes become tone rules, a word limit, a model temperature and an archetype name.

I could not verify the real Chog trait names when this was built. Open a few token metadata files, then edit the `RULES` list in `lib/personality.ts` to match the real trait values. Everything else adapts.

## Features

1. Wallet connect on Monad mainnet and testnet
2. Owned Chog discovery, with a gallery selection page (search, keyboard arrows, remembers your last pick)
3. Trait-driven prompt with a visible Voice DNA breakdown
4. Post, reply, meme and story modes, with replies shown as clean post cards
5. Meme Studio: the meme is drawn on the Chog's own artwork in the browser (no image AI needed). Six layouts, three of which unlock only when a Chog's traits are strong enough (Confidence 8, Chaos 8, Sarcasm 7). Edit the text, then download, copy, or share
6. Shareable Voice DNA card image
7. Local feed of past generations, including meme images (browser storage)
8. Echo Battle: two Chogs, one topic, you pick the winner, then let them reply to each other
9. Sample characters when no wallet is connected, clearly labeled as samples

## How memes work

1. The model returns a small JSON object: top text, bottom text, a post caption and a picture description.
2. The browser draws the meme on a canvas using the Chog's artwork. Fonts are bundled in `public/fonts`, so nothing loads from Google.
3. Real NFT images are loaded through `/api/token-image`, which fetches the image from the token's own metadata and serves it from this site. That is what allows the browser to export the picture.
4. X cannot attach an image from a link, so people download the image and add it to their post. On phones, "Share image" opens the share sheet with the file.

## Making the feed and battles shared

The feed and battles are stored in the browser. To make them public:

1. Create a Supabase project and a `generations` table with columns `id`, `created_at`, `token_id`, `token_name`, `image`, `traits` (jsonb), `kind`, `topic`, `text`, `address`, `battle_id`, `won`.
2. Replace `addFeedItem`, `updateFeedItem` and `readFeed` in `lib/feed-store.ts` with Supabase calls.
3. Write rows from a server route that has already verified ownership, never directly from the browser.
4. For live two-player battles, add a `battles` table and subscribe with Supabase Realtime.

## Limits to know about

1. Rate limiting is in memory, so it resets on cold starts and is per server instance. Use Redis or Upstash in production.
2. The session signature proves control of the address, not a fresh ownership check on every request. Ownership is rechecked on-chain on every generation.
3. Sample characters are rate limited more strictly (8 per hour per IP).

## Deploy

1. Push to GitHub.
2. Import into Vercel.
3. Add the env vars from the table.
4. Deploy.
