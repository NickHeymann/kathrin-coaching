/**
 * API Rate Limiter
 * Verhindert GitHub API Rate-Limit-Überschreitungen
 * @module rate-limiter
 */

import { CONFIG } from './config.js';

class RateLimiter {
    constructor() {
        this.calls = [];
    }

    /**
     * Prüft ob ein API-Call möglich ist
     * @returns {boolean}
     */
    canMakeCall() {
        const now = Date.now();
        this.calls = this.calls.filter(t => now - t < CONFIG.apiRateLimitWindow);
        return this.calls.length < CONFIG.apiRateLimit;
    }

    /**
     * Registriert einen API-Call
     */
    recordCall() {
        this.calls.push(Date.now());
    }

    /**
     * Berechnet Wartezeit bis nächster Call möglich
     * @returns {number} Wartezeit in ms
     */
    getWaitTime() {
        if (this.canMakeCall()) return 0;
        const oldest = Math.min(...this.calls);
        return CONFIG.apiRateLimitWindow - (Date.now() - oldest) + 100;
    }

    /**
     * Wartet falls nötig, dann führt Callback aus
     * @param {Function} callback - Auszuführende Funktion
     * @returns {Promise}
     */
    async throttle(callback) {
        if (!this.canMakeCall()) {
            const waitTime = this.getWaitTime();
            console.warn(`Rate limit erreicht. Warte ${Math.ceil(waitTime / 1000)}s...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        this.recordCall();
        return callback();
    }
}

export const rateLimiter = new RateLimiter();
