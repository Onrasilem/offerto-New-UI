// Very simple in-memory rate limiter (per IP), for low traffic/dev
const buckets = new Map();

export function rateLimit({ windowMs = 60_000, max = 10 } = {}) {
  return (req, res, next) => {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    const bucket = buckets.get(ip) || [];
    const recent = bucket.filter((t) => now - t < windowMs);
    recent.push(now);
    buckets.set(ip, recent);
    if (recent.length > max) {
      return res.status(429).json({ error: 'too many requests' });
    }
    next();
  };
}
