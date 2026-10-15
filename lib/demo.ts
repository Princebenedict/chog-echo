import type { ChogToken } from "./types";

// Sample characters for demo mode. They use Chog artwork, but they are NOT tokens from
// the collection. Their traits describe what is visible in each picture so the voice
// engine can be tried without a wallet.
export const DEMO_TOKENS: ChogToken[] = [
  {
    tokenId: "sample-a",
    name: "Main Chog",
    image: "/chog/main.jpg",
    isDemo: true,
    traits: [
      { trait_type: "Background", value: "Periwinkle" },
      { trait_type: "Hair", value: "Purple Spikes" },
      { trait_type: "Eyes", value: "Wide Eyed" },
      { trait_type: "Mouth", value: "Small Smile" },
      { trait_type: "Outfit", value: "Purple Hoodie" },
    ],
  },
  {
    tokenId: "sample-b",
    name: "Crying Chog",
    image: "/chog/nft-4.jpg",
    isDemo: true,
    traits: [
      { trait_type: "Background", value: "Red Splash" },
      { trait_type: "Headwear", value: "Grey Bucket Hat" },
      { trait_type: "Eyes", value: "Crying" },
      { trait_type: "Mouth", value: "Frown" },
      { trait_type: "Outfit", value: "Blue Suit" },
    ],
  },
  {
    tokenId: "sample-c",
    name: "Side-Eye Chog",
    image: "/chog/nft-1.jpg",
    isDemo: true,
    traits: [
      { trait_type: "Background", value: "Lavender" },
      { trait_type: "Headwear", value: "White Cap" },
      { trait_type: "Eyes", value: "Side Eye" },
      { trait_type: "Mouth", value: "Flat Line" },
      { trait_type: "Outfit", value: "Blue Track Jacket" },
    ],
  },
  {
    tokenId: "sample-d",
    name: "Worried Chog",
    image: "/chog/nft-2.jpg",
    isDemo: true,
    traits: [
      { trait_type: "Background", value: "Pale Cream" },
      { trait_type: "Headwear", value: "Red Cap" },
      { trait_type: "Eyes", value: "Worried" },
      { trait_type: "Mouth", value: "Wavy Frown" },
      { trait_type: "Outfit", value: "Red Jacket" },
    ],
  },
  {
    tokenId: "sample-e",
    name: "Crown Chog",
    image: "/chog/nft-3.jpg",
    isDemo: true,
    traits: [
      { trait_type: "Background", value: "Yellow Comic Burst" },
      { trait_type: "Headwear", value: "Gold Crown" },
      { trait_type: "Eyes", value: "Angry" },
      { trait_type: "Mouth", value: "Bubblegum" },
      { trait_type: "Outfit", value: "Red Jacket" },
    ],
  },
  {
    tokenId: "sample-f",
    name: "Drool Chog",
    image: "/chog/nft-5.jpg",
    isDemo: true,
    traits: [
      { trait_type: "Background", value: "Purple" },
      { trait_type: "Headwear", value: "Orange Cap" },
      { trait_type: "Eyes", value: "Sleepy" },
      { trait_type: "Mouth", value: "Open Drooling" },
      { trait_type: "Outfit", value: "Yellow Jersey" },
    ],
  },
];

export function getDemoToken(id: string): ChogToken | undefined {
  return DEMO_TOKENS.find((t) => t.tokenId === id);
}
