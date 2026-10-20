// Facts the character may rely on. The model has no clock and no internet, so we tell it what day it is.
// Time zones come from the visitor's browser; the time itself always comes from the server.

export function safeTimeZone(input: unknown): string {
  if (typeof input !== "string" || input.length > 64) return "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: input });
    return input;
  } catch {
    return "UTC";
  }
}

const weekday = (date: Date, timeZone: string) => new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone }).format(date);

export function buildFacts(timeZone: string, now: Date = new Date()): string[] {
  const tz = safeTimeZone(timeZone);
  const full = new Intl.DateTimeFormat("en-US", { dateStyle: "full", timeStyle: "short", timeZone: tz }).format(now);
  const day = 24 * 60 * 60 * 1000;
  return [
    `Right now it is ${full} (time zone ${tz}). Yesterday was ${weekday(new Date(now.getTime() - day), tz)}. Tomorrow is ${weekday(new Date(now.getTime() + day), tz)}.`,
    "You cannot browse the internet and you know nothing after your training. You do not know current prices, news, launches or events.",
  ];
}
