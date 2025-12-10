/**
 * middleware/auth.js
 * API-Authentifizierung für geschützte Endpoints
 * ~60 Zeilen | Verantwortung: Token-Validierung
 */

/**
 * Validiert API-Token für geschützte Routen
 * Erwartet: Authorization: Bearer <token>
 */
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Authorization header mit Bearer Token erforderlich'
        });
    }

    const token = authHeader.split(' ')[1];
    const validToken = process.env.API_SECRET_TOKEN;

    if (!validToken) {
        console.error('API_SECRET_TOKEN nicht konfiguriert!');
        return res.status(500).json({
            error: 'Server Configuration Error'
        });
    }

    // Timing-safe comparison
    if (!timingSafeEqual(token, validToken)) {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Ungültiger Token'
        });
    }

    next();
}

/**
 * Timing-safe String-Vergleich (verhindert Timing Attacks)
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function timingSafeEqual(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') {
        return false;
    }

    const crypto = require('crypto');

    // Gleiche Länge erzwingen
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);

    if (bufA.length !== bufB.length) {
        // Trotzdem Zeit verbrauchen
        crypto.timingSafeEqual(bufA, bufA);
        return false;
    }

    return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Optionale Auth - gibt req.isAuthenticated für Routen die
 * unterschiedliches Verhalten für Auth/Unauth haben
 */
function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    req.isAuthenticated = false;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const validToken = process.env.API_SECRET_TOKEN;

        if (validToken && timingSafeEqual(token, validToken)) {
            req.isAuthenticated = true;
        }
    }

    next();
}

module.exports = { authMiddleware, optionalAuth };
