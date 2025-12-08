/**
 * Security Utilities
 * XSS prevention, encoding, and validation functions
 */

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param {*} unsafe - The value to escape
 * @returns {string} HTML-safe string
 */
export function escapeHtml(unsafe) {
    if (unsafe == null) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Encodes a UTF-8 string to Base64
 * Modern replacement for deprecated btoa(unescape(encodeURIComponent()))
 * @param {string} str - The string to encode
 * @returns {string} Base64 encoded string
 */
export function utf8ToBase64(str) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    let binary = '';
    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }
    return btoa(binary);
}

/**
 * Decodes a Base64 string to UTF-8
 * Modern replacement for deprecated decodeURIComponent(escape(atob()))
 * @param {string} base64 - The Base64 string to decode
 * @returns {string} Decoded UTF-8 string
 */
export function base64ToUtf8(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
}

/**
 * Validates GitHub token format
 * @param {string} token - The token to validate
 * @returns {boolean} True if valid format
 */
export function isValidGitHubToken(token) {
    if (!token || typeof token !== 'string') return false;
    // GitHub tokens start with ghp_ (classic) or github_pat_ (fine-grained)
    return token.startsWith('ghp_') || token.startsWith('github_pat_');
}

/**
 * Sanitizes a filename for safe storage
 * @param {string} filename - The filename to sanitize
 * @returns {string} Safe filename
 */
export function sanitizeFilename(filename) {
    return String(filename)
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/\.{2,}/g, '.')
        .substring(0, 255);
}
