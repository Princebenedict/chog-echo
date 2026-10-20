// Cleans model output for display: no em dashes, no stray punctuation left behind.
export function tidy(text: string): string {
  return text
    .replace(/\s*\u2014\s*/g, ", ")
    .replace(/\s+\u2013\s+/g, ", ")
    .replace(/,\s*,/g, ",")
    .replace(/^[,\s]+/, "");
}
