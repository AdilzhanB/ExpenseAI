import { RateLimiterMemory } from 'rate-limiter-flexible';

// Different rate limiters for different endpoints
const rateLimiters = {
  // General API rate limiter
  general: new RateLimiterMemory({
    keyGenerator: (req) => req.ip,
    points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS) / 1000 || 900, // 15 minutes
  }),

  // Strict rate limiter for authentication endpoints
  auth: new RateLimiterMemory({
    keyGenerator: (req) => req.ip,
    points: 5, // 5 attempts
    duration: 900, // 15 minutes
    blockDuration: 900, // Block for 15 minutes if exceeded
  }),

  // AI endpoints rate limiter
  ai: new RateLimiterMemory({
    keyGenerator: (req) => req.user?.id || req.ip,
    points: 20, // 20 AI requests
    duration: 3600, // 1 hour
  }),

  // Upload rate limiter
  upload: new RateLimiterMemory({
    keyGenerator: (req) => req.user?.id || req.ip,
    points: 10, // 10 uploads
    duration: 3600, // 1 hour
  }),
};

export function rateLimiter(req, res, next) {
  let limiter = rateLimiters.general;

  // Choose appropriate rate limiter based on path
  if (req.path.startsWith('/api/auth/')) {
    limiter = rateLimiters.auth;
  } else if (req.path.startsWith('/api/ai/')) {
    limiter = rateLimiters.ai;
  } else if (req.path.startsWith('/api/upload/')) {
    limiter = rateLimiters.upload;
  }

  limiter.consume(req.ip)
    .then(() => {
      next();
    })
    .catch((rejRes) => {
      const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
      res.set('Retry-After', String(secs));
      res.status(429).json({
        success: false,
        message: 'Too many requests',
        retryAfter: secs
      });
    });
}

export function createRateLimiter(options) {
  const limiter = new RateLimiterMemory(options);
  
  return (req, res, next) => {
    const key = options.keyGenerator ? options.keyGenerator(req) : req.ip;
    
    limiter.consume(key)
      .then(() => next())
      .catch((rejRes) => {
        const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
        res.set('Retry-After', String(secs));
        res.status(429).json({
          success: false,
          message: 'Rate limit exceeded',
          retryAfter: secs
        });
      });
  };
}
