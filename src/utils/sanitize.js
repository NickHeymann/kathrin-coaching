/**
 * HTML Sanitization Module
 * Provides XSS protection for dynamic HTML content
 *
 * Uses DOMPurify for comprehensive sanitization
 */

// DOMPurify CDN URL with SRI hash
export const DOMPURIFY_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.8/purify.min.js';
export const DOMPURIFY_SRI = 'sha384-3XJAN3rswrHdGqLHC3V5s0ERRmJrqtOvC/1qVz8gg4RZMlWBNB9VCRa9Z6H/TqRt';

/**
 * Loads DOMPurify if not already available
 * @returns {Promise<void>}
 */
export async function loadDOMPurify() {
    if (typeof DOMPurify !== 'undefined') {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = DOMPURIFY_CDN;
        script.integrity = DOMPURIFY_SRI;
        script.crossOrigin = 'anonymous';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load DOMPurify'));
        document.head.appendChild(script);
    });
}

/**
 * Default DOMPurify configuration
 * Allows safe HTML tags while blocking scripts and dangerous attributes
 */
export const SANITIZE_CONFIG = {
    // Allowed tags
    ALLOWED_TAGS: [
        'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'mark', 'small', 'del', 'ins', 'sub', 'sup',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'dl', 'dt', 'dd',
        'a', 'img', 'figure', 'figcaption',
        'blockquote', 'pre', 'code',
        'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
        'div', 'span', 'section', 'article', 'header', 'footer', 'nav', 'aside',
        'hr', 'address', 'time'
    ],
    // Allowed attributes
    ALLOWED_ATTR: [
        'href', 'src', 'alt', 'title', 'class', 'id', 'name',
        'width', 'height', 'style', 'target', 'rel',
        'colspan', 'rowspan', 'datetime', 'loading'
    ],
    // Allow data attributes
    ALLOW_DATA_ATTR: true,
    // Force all links to have noopener
    ADD_ATTR: ['target'],
    // Hooks to modify output
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur']
};

/**
 * Strict config for user-generated content (comments, etc.)
 */
export const STRICT_CONFIG = {
    ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'strong', 'em', 'a', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
    FORCE_BODY: true
};

/**
 * Sanitizes HTML content
 * @param {string} dirty - Untrusted HTML string
 * @param {Object} [config] - Optional DOMPurify configuration
 * @returns {string} Sanitized HTML
 */
export function sanitizeHTML(dirty, config = SANITIZE_CONFIG) {
    if (typeof DOMPurify === 'undefined') {
        console.warn('DOMPurify not loaded, falling back to text content');
        return escapeHTML(dirty);
    }

    // Configure DOMPurify to add rel="noopener" to links
    DOMPurify.addHook('afterSanitizeAttributes', function(node) {
        if (node.tagName === 'A') {
            node.setAttribute('rel', 'noopener noreferrer');
            if (node.getAttribute('target') === '_blank') {
                // Already has noopener from hook
            }
        }
        // Add loading="lazy" to images
        if (node.tagName === 'IMG') {
            node.setAttribute('loading', 'lazy');
        }
    });

    const clean = DOMPurify.sanitize(dirty, config);

    // Remove hook after use to prevent memory leaks
    DOMPurify.removeHook('afterSanitizeAttributes');

    return clean;
}

/**
 * Sanitizes HTML with strict settings (for user content)
 * @param {string} dirty - Untrusted HTML string
 * @returns {string} Sanitized HTML
 */
export function sanitizeUserContent(dirty) {
    return sanitizeHTML(dirty, STRICT_CONFIG);
}

/**
 * Basic HTML escaping (fallback when DOMPurify unavailable)
 * @param {string} unsafe - Untrusted string
 * @returns {string} Escaped string
 */
export function escapeHTML(unsafe) {
    if (unsafe == null) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Safely sets innerHTML with sanitization
 * @param {HTMLElement} element - Target element
 * @param {string} html - HTML content to set
 * @param {Object} [config] - Optional sanitization config
 */
export function safeInnerHTML(element, html, config = SANITIZE_CONFIG) {
    if (!element) return;
    element.innerHTML = sanitizeHTML(html, config);
}

/**
 * Creates a DOM element from HTML string safely
 * @param {string} html - HTML string
 * @param {Object} [config] - Optional sanitization config
 * @returns {DocumentFragment} Safe DOM fragment
 */
export function createSafeFragment(html, config = SANITIZE_CONFIG) {
    const clean = sanitizeHTML(html, config);
    const template = document.createElement('template');
    template.innerHTML = clean;
    return template.content;
}

/**
 * URL sanitization - prevents javascript: and data: URLs
 * @param {string} url - URL to sanitize
 * @returns {string} Safe URL or empty string
 */
export function sanitizeURL(url) {
    if (!url) return '';

    const trimmed = url.trim().toLowerCase();

    // Block dangerous protocols
    if (trimmed.startsWith('javascript:') ||
        trimmed.startsWith('data:') ||
        trimmed.startsWith('vbscript:')) {
        console.warn('Blocked dangerous URL:', url);
        return '';
    }

    return url;
}

/**
 * Validates and sanitizes image src
 * @param {string} src - Image source
 * @returns {string} Safe src or placeholder
 */
export function sanitizeImageSrc(src) {
    if (!src) return '';

    const safe = sanitizeURL(src);
    if (!safe) {
        return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"%3E%3C/svg%3E';
    }

    return safe;
}

// Auto-initialize DOMPurify when module loads (non-blocking)
if (typeof document !== 'undefined') {
    loadDOMPurify().catch(err => {
        console.warn('DOMPurify auto-load failed:', err.message);
    });
}
