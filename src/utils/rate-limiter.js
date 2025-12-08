/**
 * Rate Limiter
 * Prevents exceeding API rate limits
 */

export class RateLimiter {
    /**
     * Creates a new rate limiter
     * @param {number} maxCalls - Maximum calls allowed in the window
     * @param {number} windowMs - Time window in milliseconds
     */
    constructor(maxCalls = 30, windowMs = 60000) {
        this.maxCalls = maxCalls;
        this.windowMs = windowMs;
        this.calls = [];
    }

    /**
     * Cleans up old calls outside the time window
     * @private
     */
    _cleanup() {
        const now = Date.now();
        this.calls = this.calls.filter(t => now - t < this.windowMs);
    }

    /**
     * Checks if a new call can be made
     * @returns {boolean} True if under the rate limit
     */
    canMakeCall() {
        this._cleanup();
        return this.calls.length < this.maxCalls;
    }

    /**
     * Records a new API call
     */
    recordCall() {
        this.calls.push(Date.now());
    }

    /**
     * Gets the wait time before next call is allowed
     * @returns {number} Milliseconds to wait (0 if can call now)
     */
    getWaitTime() {
        if (this.canMakeCall()) return 0;
        const oldest = Math.min(...this.calls);
        return this.windowMs - (Date.now() - oldest) + 100;
    }

    /**
     * Waits until a call can be made
     * @returns {Promise<void>}
     */
    async waitForSlot() {
        const waitTime = this.getWaitTime();
        if (waitTime > 0) {
            console.warn(`Rate limit reached. Waiting ${Math.ceil(waitTime / 1000)}s...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }

    /**
     * Gets current usage statistics
     * @returns {{ used: number, max: number, resetIn: number }}
     */
    getStats() {
        this._cleanup();
        const oldest = this.calls.length > 0 ? Math.min(...this.calls) : Date.now();
        return {
            used: this.calls.length,
            max: this.maxCalls,
            resetIn: Math.max(0, this.windowMs - (Date.now() - oldest))
        };
    }
}

// Default singleton instance
export const apiRateLimiter = new RateLimiter(30, 60000);
