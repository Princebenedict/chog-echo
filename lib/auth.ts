export const SESSION_MS = 24 * 60 * 60 * 1000;

export function buildAuthMessage(address: string, issuedAt: number): string {
  return [
    "Chog Echo access",
    "I hold a Chog NFT and want to generate content with it.",
    `Address: ${address}`,
    `Issued: ${new Date(issuedAt).toISOString()}`,
  ].join("\n");
}
