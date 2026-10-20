export type Trait = { trait_type: string; value: string };

export type ChogToken = {
  tokenId: string;
  name: string;
  image: string | null;
  traits: Trait[];
  isDemo?: boolean;
};

export type Kind = "post" | "reply" | "meme" | "story";

export const KINDS: { id: Kind; label: string; hint: string }[] = [
  { id: "post", label: "Post", hint: "A standalone post on your topic" },
  { id: "reply", label: "Reply", hint: "A reply to something you paste in" },
  { id: "meme", label: "Meme", hint: "Top and bottom caption plus the image idea" },
  { id: "story", label: "Story", hint: "A very short story" },
];

export type FeedItem = {
  id: string;
  createdAt: number;
  tokenId: string;
  tokenName: string;
  image: string | null;
  traits: Trait[];
  kind: Kind;
  topic: string;
  target?: string;
  text: string;
  demo: boolean;
  battleId?: string;
  won?: boolean;
  meme?: { layout: string; top: string; bottom: string; caption: string; description: string };
  imageSrc?: string | null;
};
