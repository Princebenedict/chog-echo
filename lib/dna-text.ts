import type { AxisKey, TraitEffect } from "./personality";

// One colour per score. Purple stays dominant, with mint and the pink of the Chog cheeks as accents.
export const AXIS_COLORS: Record<AxisKey, string> = {
  confidence: "#8754F6",
  sarcasm: "#A46CFF",
  chaos: "#55F0B0",
  warmth: "#F27BB5",
  brevity: "#C9B8F5",
};

const sentence = (text: string) => {
  const t = text.trim().replace(/[.]+$/, "");
  return t ? `${t[0].toUpperCase()}${t.slice(1)}.` : "";
};

// Turns the stored rule text ("Crown energy: total, unearned confidence") into a clean sentence for display.
export function describeEffect(effect: TraitEffect): { detail: string; seeded: boolean } {
  if (!effect.matched) {
    const m = /seeds (?:a |an )?(.+)$/i.exec(effect.effect);
    return { detail: sentence(m ? `Seeded quirk: ${m[1]}` : effect.effect), seeded: true };
  }
  const colon = effect.effect.indexOf(": ");
  return { detail: sentence(colon === -1 ? effect.effect : effect.effect.slice(colon + 2)), seeded: false };
}
