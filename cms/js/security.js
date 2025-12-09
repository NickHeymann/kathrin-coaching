/**
 * CMS Editor Security Utilities
 * XSS-Prävention, HTML-Sanitization, sichere Encoding-Funktionen
 * @module security
 */

/**
 * Escaped HTML-Sonderzeichen um XSS zu verhindern
 * @param {string} unsafe - Unsicherer String
 * @returns {string} Escaped String
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
 * Sanitized HTML mit DOMPurify (für dynamischen HTML-Content)
 * @param {string} dirty - Unsicheres HTML
 * @returns {string} Sanitized HTML
 */
export function sanitizeHTML(dirty) {
    if (typeof DOMPurify !== 'undefined') {
        return DOMPurify.sanitize(dirty, {
            ALLOWED_TAGS: [
                'p', 'br', 'b', 'i', 'u', 'strong', 'em',
                'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                'ul', 'ol', 'li', 'a', 'img', 'blockquote',
                'pre', 'code', 'div', 'span',
                'table', 'thead', 'tbody', 'tr', 'th', 'td',
                'hr', 'figure', 'figcaption'
            ],
            ALLOWED_ATTR: [
                'href', 'src', 'alt', 'title', 'class', 'id',
                'style', 'target', 'rel',
                'width', 'height', 'loading', 'data-*'
            ],
            FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form'],
            FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
        });
    }
    return escapeHtml(dirty);
}

/**
 * Setzt innerHTML sicher mit Sanitization
 * @param {HTMLElement} element - Ziel-Element
 * @param {string} html - HTML-Content
 */
export function safeSetHTML(element, html) {
    if (element) {
        element.innerHTML = sanitizeHTML(html);
    }
}

/**
 * Sichere UTF-8 zu Base64 Konvertierung
 * @param {string} str - UTF-8 String
 * @returns {string} Base64-encoded String
 */
export function utf8ToBase64(str) {
    return btoa(
        new TextEncoder()
            .encode(str)
            .reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
}

/**
 * Sichere Base64 zu UTF-8 Konvertierung
 * @param {string} base64 - Base64-encoded String
 * @returns {string} UTF-8 String
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
 * Validiert GitHub Token Format
 * @param {string} token - GitHub Token
 * @returns {boolean} Ist valide
 */
export function isValidTokenFormat(token) {
    if (!token || typeof token !== 'string') return false;
    return token.startsWith('ghp_') || token.startsWith('github_pat_');
}
