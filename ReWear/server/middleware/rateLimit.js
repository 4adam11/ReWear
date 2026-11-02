// Simple in-memory rate limiter (per IP, per route group).
// Fine for a single server process; use express-rate-limit + Redis if scaled out.
const rateLimit = ({ windowMs, max, message }) => {
  const hits = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip;
    const entry = hits.get(key);

    if (!entry || now > entry.resetAt) {
      // Drop expired entries now and then so the map can't grow forever
      if (hits.size > 10000) {
        for (const [k, v] of hits) {
          if (now > v.resetAt) hits.delete(k);
        }
      }

      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;

    if (entry.count > max) {
      res.set("Retry-After", Math.ceil((entry.resetAt - now) / 1000));
      return res.status(429).json({ message });
    }

    next();
  };
};

export default rateLimit;
