/**
 * middleware/rate-limit.js
 * Rate Limiting für API-Schutz
 * ~80 Zeilen | Verantwortung: Request Throttling
 */

/**
 * In-Memory Store für Rate Limits
 * In Production: Redis verwenden!
 */
const rateLimitStore = new Map();

/**
 * Cleanup alte Einträge (alle 5 Minuten)
 */
setInterval(() => {
    const now = Date.now();
    for (const [key, data] of rateLimitStore.entries()) {
        if (now > data.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

/**
 * Erstellt Rate Limiter Middleware
 * @param {Object} options
 * @param {number} options.windowMs - Zeitfenster in ms (default: 15 min)
 * @param {number} options.max - Max Requests pro Fenster (default: 100)
 * @param {string} options.message - Fehlermeldung
 * @returns {Function} Express Middleware
 */
function createRateLimiter(options = {}) {
    const {
        windowMs = 15 * 60 * 1000,  // 15 Minuten
        max = 100,
        message = 'Zu viele Anfragen. Bitte später erneut versuchen.'
    } = options;

    return (req, res, next) => {
        // Key: IP + Route
        const key = `${req.ip}:${req.path}`;
        const now = Date.now();

        let record = rateLimitStore.get(key);

        if (!record || now > record.resetTime) {
            // Neues Fenster starten
            record = {
                count: 1,
                resetTime: now + windowMs
            };
            rateLimitStore.set(key, record);
        } else {
            record.count++;
        }

        // Headers setzen
        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
        res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

        if (record.count > max) {
            return res.status(429).json({
                error: 'Too Many Requests',
                message,
                retryAfter: Math.ceil((record.resetTime - now) / 1000)
            });
        }

        next();
    };
}

// Vordefinierte Limiter
const limiters = {
    // Standard API: 100 req / 15 min
    standard: createRateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }),

    // Auth Endpoints: 10 req / 15 min (Brute-Force Schutz)
    auth: createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }),

    // Write Operations: 30 req / 15 min
    write: createRateLimiter({ windowMs: 15 * 60 * 1000, max: 30 }),

    // Heavy Operations (AI, Export): 5 req / min
    heavy: createRateLimiter({ windowMs: 60 * 1000, max: 5 })
};

module.exports = { createRateLimiter, limiters };
