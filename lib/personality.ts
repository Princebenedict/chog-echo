import type { Trait } from "./types";

export type Axes = {
  confidence: number;
  sarcasm: number;
  chaos: number;
  warmth: number;
  brevity: number;
};
export type AxisKey = keyof Axes;

export const AXIS_LABELS: Record<AxisKey, string> = {
  confidence: "Confidence",
  sarcasm: "Sarcasm",
  chaos: "Chaos",
  warmth: "Warmth",
  brevity: "Brevity",
};

export type Category = "background" | "aura" | "headwear" | "eyes" | "mouth" | "outfit" | "item" | "other";

export type TraitEffect = {
  trait: Trait;
  category: Category;
  effect: string;
  voice: string;
  deltas: Partial<Axes>;
  matched: boolean;
};

export type Persona = {
  archetype: string;
  axes: Axes;
  effects: TraitEffect[];
  voiceLines: string[];
  toneRules: string[];
  maxWords: number;
  lengthRule: string;
  temperature: number;
};

type Rule = {
  cats?: Category[];
  re: RegExp;
  deltas: Partial<Axes>;
  effect: string;
  voice: string;
};

const CATEGORY_PATTERNS: [Category, RegExp][] = [
  ["aura", /aura|glow|halo effect/i],
  ["background", /back ?ground|^bg$|scene|setting/i],
  ["headwear", /head|hat|cap\b|crown|helmet|hair|horn/i],
  ["eyes", /eye|expression|face|mood|look/i],
  ["mouth", /mouth|lip|teeth|tongue|beard/i],
  ["outfit", /cloth|outfit|shirt|body|suit|armor|wear|fur|skin|torso/i],
  ["item", /item|hand|held|accessor|prop|weapon|gear|neck|ear|glasses/i],
];

export function categorize(traitType: string): Category {
  for (const [cat, re] of CATEGORY_PATTERNS) if (re.test(traitType)) return cat;
  return "other";
}

export function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Ordered rules. The first rule whose category and pattern both match wins for a trait.
const RULES: Rule[] = [
  // Background: controls length and overall energy
  { cats: ["background"], re: /black|dark|night|space|void|noir|grey|gray|shadow/i, deltas: { brevity: 2, warmth: -1 }, effect: "Dark backdrop: terse, noir delivery with short lines", voice: "speaks in clipped, late-night noir lines" },
  { cats: ["background"], re: /yellow|orange|pink|sun|gold|candy|rainbow|peach/i, deltas: { brevity: -2, warmth: 2 }, effect: "Bright backdrop: bouncy and chatty, runs a little long", voice: "bounces between thoughts with open, sunny energy" },
  { cats: ["background"], re: /green|lime|mint|matrix|neon/i, deltas: { confidence: 1, chaos: 1 }, effect: "Green backdrop: degen alpha-speak, always early", voice: "talks like someone who was early and wants you to know" },
  { cats: ["background"], re: /blue|sky|ocean|water|ice|sea/i, deltas: { warmth: 1, chaos: -2 }, effect: "Cool backdrop: calm, measured, steady pacing", voice: "keeps a calm, level pace" },
  { cats: ["background"], re: /purple|violet|monad|lavender|grape|periwinkle|indigo/i, deltas: { confidence: 1, warmth: 1 }, effect: "Purple backdrop: Monad-native, proud of the home chain", voice: "treats Monad culture as home turf" },
  { cats: ["background"], re: /red|fire|lava|blood/i, deltas: { chaos: 2, brevity: 1 }, effect: "Red backdrop: heated, impatient, quick to snap", voice: "sounds a little overheated and impatient" },

  // Aura: the collection has an Aura trait, so it gets its own rules
  { cats: ["aura"], re: /fire|flame|red|lava|burn/i, deltas: { chaos: 2, confidence: 1 }, effect: "Fiery aura: runs hot, loud and impatient", voice: "runs hot and says it loud" },
  { cats: ["aura"], re: /gold|glow|holy|rainbow|diamond|light|shine/i, deltas: { confidence: 2, warmth: 1 }, effect: "Radiant aura: main character energy", voice: "carries main character energy" },
  { cats: ["aura"], re: /dark|shadow|void|dead|ghost|smoke/i, deltas: { sarcasm: 2, warmth: -1 }, effect: "Dark aura: brooding, mysterious, unimpressed", voice: "stays brooding and mysterious" },
  { cats: ["aura"], re: /ice|frost|water|blue|cool/i, deltas: { chaos: -1, sarcasm: 1 }, effect: "Cool aura: collected and a little aloof", voice: "stays collected and slightly aloof" },
  { cats: ["aura"], re: /green|toxic|acid|poison|slime/i, deltas: { chaos: 2, sarcasm: 1 }, effect: "Toxic aura: gleefully unhinged", voice: "is gleefully unhinged" },

  // Headwear: confidence and posture
  { cats: ["headwear"], re: /crown|king|queen|royal|gold|diamond|halo|tiara/i, deltas: { confidence: 3 }, effect: "Crown energy: total, unearned confidence", voice: "addresses the timeline like royalty, no hedging" },
  { cats: ["headwear"], re: /wizard|witch|mage|magic|star|moon/i, deltas: { chaos: 1, warmth: 1 }, effect: "Mystic headwear: cryptic metaphors and gentle weirdness", voice: "slips in cryptic, mystical metaphors" },
  { cats: ["headwear"], re: /helmet|hard hat|cap\b|beanie|hood|bandana|headband|bucket/i, deltas: { confidence: 1, brevity: 1 }, effect: "Streetwear headwear: low-effort cadence, lowercase leaning", voice: "writes in an easy, lowercase-leaning streetwear cadence" },
  { cats: ["headwear"], re: /spike|spiky|mohawk|punk|mullet|afro/i, deltas: { chaos: 2, confidence: 1 }, effect: "Spiky hair: restless, a little punk, always mid-motion", voice: "sounds restless and a little punk" },
  { cats: ["headwear"], re: /^none$|^no |bald|bare/i, deltas: { confidence: -1 }, effect: "Bare head: understated, plain talk", voice: "uses plain words with nothing to prove" },

  // Eyes / expression: sarcasm, warmth, drama
  { cats: ["eyes"], re: /sleep|tired|bored|half|droop|meh|dead|blank/i, deltas: { sarcasm: 3, brevity: 2 }, effect: "Sleepy eyes: deadpan with minimal effort", voice: "delivers everything deadpan with minimal effort" },
  { cats: ["eyes"], re: /angry|mad|rage|fire|red|furious/i, deltas: { chaos: 3, confidence: 1 }, effect: "Angry eyes: volatile, opinionated, quick to escalate", voice: "escalates fast and takes strong sides" },
  { cats: ["eyes"], re: /happy|smile|joy|love|heart|sparkle|star|shine/i, deltas: { warmth: 3, sarcasm: -2 }, effect: "Bright eyes: sincere, encouraging, no irony", voice: "means every nice thing it says" },
  { cats: ["eyes"], re: /wink|smirk|side|sus|squint|sly/i, deltas: { sarcasm: 3, confidence: 1 }, effect: "Sly eyes: knowing, teasing, always half joking", voice: "teases like it knows something you do not" },
  { cats: ["eyes"], re: /cry|sad|tear|worried|scared|nervous/i, deltas: { warmth: 1, confidence: -2, chaos: 1 }, effect: "Teary eyes: dramatic and vulnerable", voice: "is dramatic, vulnerable and a bit anxious" },
  { cats: ["eyes"], re: /laser|cyber|robot|glitch|matrix|visor|sunglass|shade|3d/i, deltas: { confidence: 2, sarcasm: 1 }, effect: "Cool eyes: detached, unbothered, slightly futuristic", voice: "stays cool and detached, a little futuristic" },
  { cats: ["eyes"], re: /wide|curious|big|round|bright/i, deltas: { warmth: 2, chaos: 1 }, effect: "Wide eyes: curious, easily amazed, asks questions", voice: "sounds curious and easily amazed" },

  // Mouth
  { cats: ["mouth"], re: /open|shout|scream|tongue|teeth|laugh|drool|slobber/i, deltas: { chaos: 2 }, effect: "Open mouth: blurts, interrupts itself, loud energy", voice: "blurts things out and interrupts itself" },
  { cats: ["mouth"], re: /smile|grin|happy/i, deltas: { warmth: 2 }, effect: "Smiling mouth: friendly, inviting tone", voice: "keeps a friendly, inviting tone" },
  { cats: ["mouth"], re: /cigar|pipe|toothpick|gum|straw/i, deltas: { sarcasm: 1, confidence: 2 }, effect: "Prop in mouth: unbothered and slow to react", voice: "stays unbothered and takes its time" },
  { cats: ["mouth"], re: /frown|flat|line|zip|mask/i, deltas: { brevity: 2, warmth: -1 }, effect: "Flat mouth: says less, means it", voice: "says little and means all of it" },

  // Outfit
  { cats: ["outfit"], re: /suit|tux|tie|blazer|formal/i, deltas: { confidence: 2, chaos: -2 }, effect: "Formal outfit: polished, corporate, controlled", voice: "sounds polished, like a keynote speaker" },
  { cats: ["outfit"], re: /hoodie|tee|shirt|jersey|hawaiian|sweater/i, deltas: { chaos: 1, warmth: 1 }, effect: "Casual outfit: relaxed, a bit goofy", voice: "stays relaxed and a bit goofy" },
  { cats: ["outfit"], re: /armor|knight|cape|hero|warrior|samurai/i, deltas: { confidence: 2, chaos: 1 }, effect: "Heroic outfit: dramatic declarations and quest language", voice: "frames small things as epic quests" },
  { cats: ["outfit"], re: /robe|kimono|monk|pajama|bath/i, deltas: { warmth: 1, chaos: -1 }, effect: "Robe: serene, slightly smug about being relaxed", voice: "is serene and slightly smug about it" },

  // Items
  { cats: ["item"], re: /sword|gun|weapon|axe|hammer|bat\b/i, deltas: { confidence: 1, chaos: 1 }, effect: "Weapon: blunt, a little threatening, all bark", voice: "is blunt and a little threatening, mostly for show" },
  { cats: ["item"], re: /coin|money|cash|bag|gem|chest|trophy/i, deltas: { confidence: 1 }, effect: "Valuables: keeps reaching for money metaphors", voice: "keeps reaching for money and treasure metaphors" },
  { cats: ["item"], re: /book|scroll|pen|laptop|phone|screen|controller/i, deltas: { sarcasm: 1 }, effect: "Gadget or book: terminally online references", voice: "makes terminally online references" },
  { cats: ["item"], re: /flower|heart|plush|toy|teddy|cake|pizza/i, deltas: { warmth: 2 }, effect: "Comfort item: soft, wholesome, easily delighted", voice: "is soft, wholesome and easily delighted" },

  // Any trait that is explicitly absent
  { re: /^(none|no|nothing|n\/a)$/i, deltas: {}, effect: "Empty slot: this part of the voice stays neutral", voice: "" },
];

const FALLBACKS: { deltas: Partial<Axes>; effect: string; voice: string }[] = [
  { deltas: { chaos: 1 }, effect: "No keyword match, so this trait seeds a random tangent habit", voice: "drops one oddly specific detail nobody asked for" },
  { deltas: { sarcasm: 1 }, effect: "No keyword match, so this trait seeds a dry aside", voice: "ends with a quiet one-line aside" },
  { deltas: { warmth: 1 }, effect: "No keyword match, so this trait seeds a soft spot", voice: "roots for the reader in a small way" },
  { deltas: { confidence: 1 }, effect: "No keyword match, so this trait seeds a hot take habit", voice: "states a small opinion as settled fact" },
  { deltas: { brevity: 1 }, effect: "No keyword match, so this trait seeds a clipped rhythm", voice: "prefers short sentences with hard stops" },
  { deltas: { chaos: 1, warmth: 1 }, effect: "No keyword match, so this trait seeds sudden enthusiasm", voice: "bursts into brief excitement mid-thought" },
  { deltas: { sarcasm: 1, brevity: -1 }, effect: "No keyword match, so this trait seeds long-winded irony", voice: "builds an elaborate setup before a flat punchline" },
  { deltas: { confidence: -1, warmth: 1 }, effect: "No keyword match, so this trait seeds humble charm", voice: "undersells itself before landing the point" },
];

const clamp = (n: number) => Math.max(0, Math.min(10, n));

function resolveTrait(trait: Trait): TraitEffect {
  const category = categorize(trait.trait_type);
  const text = trait.value;

  for (const rule of RULES) {
    if (rule.cats && !rule.cats.includes(category)) continue;
    if (rule.re.test(text)) {
      return { trait, category, effect: rule.effect, voice: rule.voice, deltas: rule.deltas, matched: true };
    }
  }

  const fb = FALLBACKS[hash(`${trait.trait_type}:${trait.value}`) % FALLBACKS.length];
  return { trait, category, effect: fb.effect, voice: fb.voice, deltas: fb.deltas, matched: false };
}

function archetypeFor(axes: Axes): string {
  const keys = Object.keys(axes) as AxisKey[];
  let best: AxisKey = "confidence";
  let bestDev = 0;
  for (const k of keys) {
    const dev = axes[k] - 5;
    if (Math.abs(dev) > Math.abs(bestDev)) {
      best = k;
      bestDev = dev;
    }
  }
  if (Math.abs(bestDev) < 1.5) return "The Even-Keeled Local";
  const high: Record<AxisKey, string> = {
    confidence: "The Smug Oracle",
    sarcasm: "The Deadpan Heckler",
    chaos: "The Loose Cannon",
    warmth: "The Cozy Hype Friend",
    brevity: "The Terse Operator",
  };
  const low: Record<AxisKey, string> = {
    confidence: "The Nervous Bard",
    sarcasm: "The Sincere Optimist",
    chaos: "The Careful Planner",
    warmth: "The Cold Analyst",
    brevity: "The Happy Rambler",
  };
  return bestDev > 0 ? high[best] : low[best];
}

export function derivePersona(traits: Trait[]): Persona {
  const axes: Axes = { confidence: 5, sarcasm: 5, chaos: 5, warmth: 5, brevity: 5 };
  const effects = traits.map(resolveTrait);

  for (const e of effects) {
    for (const k of Object.keys(e.deltas) as AxisKey[]) {
      axes[k] += e.deltas[k] ?? 0;
    }
  }
  for (const k of Object.keys(axes) as AxisKey[]) axes[k] = clamp(axes[k]);

  const maxWords = axes.brevity >= 8 ? 16 : axes.brevity >= 6 ? 28 : axes.brevity >= 4 ? 45 : axes.brevity >= 2 ? 65 : 85;

  const toneRules: string[] = [];
  if (axes.confidence >= 7) toneRules.push("State opinions as facts. Never hedge or apologize.");
  else if (axes.confidence <= 3) toneRules.push("Sound hesitant and self-deprecating, but still land the point.");
  if (axes.sarcasm >= 7) toneRules.push("Be dry and sarcastic. Irony over sincerity.");
  else if (axes.sarcasm <= 3) toneRules.push("Be sincere. No irony and no mockery.");
  if (axes.chaos >= 7) toneRules.push("Be unpredictable. Take one sudden tangent, but stay on topic overall.");
  else if (axes.chaos <= 3) toneRules.push("Be orderly and deliberate. No tangents.");
  if (axes.warmth >= 7) toneRules.push("Be warm and encouraging toward the reader.");
  else if (axes.warmth <= 3) toneRules.push("Be cool and detached. No cheerleading.");
  if (toneRules.length === 0) toneRules.push("Keep a balanced, conversational tone with one distinct quirk.");

  return {
    archetype: archetypeFor(axes),
    axes,
    effects,
    voiceLines: Array.from(new Set(effects.map((e) => e.voice).filter(Boolean))),
    toneRules,
    maxWords,
    lengthRule: `Keep it under ${maxWords} words.`,
    temperature: Math.round((0.7 + axes.chaos * 0.04) * 100) / 100,
  };
}
