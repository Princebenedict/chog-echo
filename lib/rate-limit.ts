type Bucket = { count: number; reset: number };

const buckets = new Map<string, Bucket>();

export function hit(key: string, limit: number, windowMs: number): { ok: boolean; retryIn: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, retryIn: 0 };
  }
  if (bucket.count >= limit) {
    return { ok: false, retryIn: Math.ceil((bucket.reset - now) / 1000) };
  }
  bucket.count += 1;
  return { ok: true, retryIn: 0 };
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd ? fwd.split(",")[0].trim() : "local";
}
