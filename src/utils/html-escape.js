/**
 * HTML Escape Utility
 * Standalone module for XSS prevention
 * Can be included in any page that needs HTML escaping
 */

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param {*} unsafe - The value to escape (will be converted to string)
 * @returns {string} - HTML-safe string
 */
function escapeHtml(unsafe) {
    if (unsafe == null) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Creates a safe HTML string from a template
 * Usage: safeHtml`<div>${userInput}</div>`
 * @param {TemplateStringsArray} strings - Template literal strings
 * @param {...any} values - Values to interpolate (will be escaped)
 * @returns {string} - Safe HTML string
 */
function safeHtml(strings, ...values) {
    return strings.reduce((result, str, i) => {
        const value = values[i - 1];
        const escaped = value != null ? escapeHtml(value) : '';
        return result + escaped + str;
    });
}

/**
 * Safely sets innerHTML with escaped content
 * @param {HTMLElement} element - Target element
 * @param {string} html - HTML string (dynamic parts should be pre-escaped)
 */
function setInnerHTML(element, html) {
    if (element) {
        element.innerHTML = html;
    }
}

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { escapeHtml, safeHtml, setInnerHTML };
}

// Also make available globally for non-module usage
if (typeof window !== 'undefined') {
    window.escapeHtml = escapeHtml;
    window.safeHtml = safeHtml;
    window.setInnerHTML = setInnerHTML;
}
