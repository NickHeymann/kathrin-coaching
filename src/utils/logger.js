/**
 * Logger Utility
 * Provides conditional logging that can be disabled in production
 *
 * Usage:
 * import { log, warn, error, setDebugMode } from './utils/logger.js';
 * log('Debug message'); // Only shows in debug mode
 * warn('Warning'); // Always shows
 * error('Error'); // Always shows
 */

// Debug mode: false in production, true in development
// Can be enabled via URL parameter ?debug=true or localStorage
let DEBUG_MODE = false;

// Check if we're in development mode
if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const storedDebug = localStorage.getItem('debug_mode');

    DEBUG_MODE = params.get('debug') === 'true' ||
                 storedDebug === 'true' ||
                 window.location.hostname === 'localhost' ||
                 window.location.hostname === '127.0.0.1';
}

/**
 * Enable or disable debug mode
 * @param {boolean} enabled
 */
export function setDebugMode(enabled) {
    DEBUG_MODE = enabled;
    if (typeof localStorage !== 'undefined') {
        if (enabled) {
            localStorage.setItem('debug_mode', 'true');
        } else {
            localStorage.removeItem('debug_mode');
        }
    }
}

/**
 * Check if debug mode is enabled
 * @returns {boolean}
 */
export function isDebugMode() {
    return DEBUG_MODE;
}

/**
 * Log message (only in debug mode)
 * @param {...any} args
 */
export function log(...args) {
    if (DEBUG_MODE) {
        console.log('[DEBUG]', ...args);
    }
}

/**
 * Warning message (always shown)
 * @param {...any} args
 */
export function warn(...args) {
    console.warn('[WARN]', ...args);
}

/**
 * Error message (always shown)
 * @param {...any} args
 */
export function error(...args) {
    console.error('[ERROR]', ...args);
}

/**
 * Info message (only in debug mode)
 * @param {...any} args
 */
export function info(...args) {
    if (DEBUG_MODE) {
        console.info('[INFO]', ...args);
    }
}

/**
 * Group logs together (only in debug mode)
 * @param {string} label
 * @param {Function} fn - Function that contains log statements
 */
export function group(label, fn) {
    if (DEBUG_MODE) {
        console.group(label);
        fn();
        console.groupEnd();
    }
}

/**
 * Time a function (only in debug mode)
 * @param {string} label
 * @param {Function} fn
 * @returns {*} Result of fn
 */
export function time(label, fn) {
    if (DEBUG_MODE) {
        console.time(label);
        const result = fn();
        console.timeEnd(label);
        return result;
    }
    return fn();
}

/**
 * Async time measurement (only in debug mode)
 * @param {string} label
 * @param {Function} asyncFn
 * @returns {Promise<*>}
 */
export async function timeAsync(label, asyncFn) {
    if (DEBUG_MODE) {
        console.time(label);
        const result = await asyncFn();
        console.timeEnd(label);
        return result;
    }
    return asyncFn();
}

// Export default logger object for convenience
export default {
    log,
    warn,
    error,
    info,
    group,
    time,
    timeAsync,
    setDebugMode,
    isDebugMode
};
