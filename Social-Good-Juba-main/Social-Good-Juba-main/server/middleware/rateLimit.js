const { RateLimiterMemory } = require('rate-limiter-flexible');

// General rate limiter
const generalRateLimiter = new RateLimiterMemory({
    points: 100, // 100 requests
    duration: 60, // per 60 seconds
});

// Auth rate limiter (stricter for auth endpoints)
const authRateLimiter = new RateLimiterMemory({
    points: 10, // 10 requests
    duration: 300, // per 5 minutes
});

// Apply rate limiting middleware
const rateLimitMiddleware = (limiter) => {
    return (req, res, next) => {
        limiter.consume(req.ip)
            .then(() => {
                next();
            })
            .catch(() => {
                res.status(429).json({ error: 'Too many requests' });
            });
    };
};

module.exports = {
    generalRateLimiter,
    authRateLimiter,
    rateLimitMiddleware
};
