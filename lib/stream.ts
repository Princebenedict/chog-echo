import { tidy } from "./text";

export class EchoError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

export async function streamGenerate(
  body: Record<string, unknown>,
  onChunk: (full: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    let message = "Generation failed.";
    let code = "UNKNOWN";
    try {
      const data = await res.json();
      message = data.error ?? message;
      code = data.code ?? code;
    } catch {
      // keep defaults
    }
    throw new EchoError(message, code);
  }
  if (!res.body) throw new EchoError("The server sent an empty response.", "EMPTY");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    full += decoder.decode(value, { stream: true });
    onChunk(tidy(full));
  }
  full += decoder.decode();
  const clean = tidy(full);
  onChunk(clean);

  if (!clean.trim()) throw new EchoError("The model returned nothing. Try again.", "EMPTY");
  return clean.trim();
}
