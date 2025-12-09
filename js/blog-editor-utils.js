/* blog-editor-utils.js
 * Hilfsfunktionen: HTML-Escape, Sanitize, Base64, Slug, Toast
 * Zeilen: ~100 | Verantwortung: Utility Functions
 */

// HTML escapen für sicheren Output
function escapeHtml(unsafe) {
    if (unsafe == null) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// HTML sanitizen mit DOMPurify
function sanitizeHTML(dirty) {
    if (typeof DOMPurify !== 'undefined') {
        return DOMPurify.sanitize(dirty, {
            ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'u', 'strong', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                           'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'pre', 'code', 'div', 'span',
                           'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'figure', 'figcaption'],
            ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'style', 'target', 'rel',
                           'width', 'height', 'loading'],
            FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form'],
            FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
        });
    }
    return escapeHtml(dirty);
}

// Sichere UTF-8 Base64 Encoding (ersetzt deprecated unescape)
function utf8ToBase64(str) {
    return btoa(new TextEncoder().encode(str).reduce((data, byte) => data + String.fromCharCode(byte), ''));
}

function base64ToUtf8(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
}

// URL-freundlichen Slug generieren
function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

// Datum formatieren
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

// Toast Notification anzeigen
function toast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toastEl = document.createElement('div');
    toastEl.className = `toast ${type}`;
    toastEl.textContent = message;
    container.appendChild(toastEl);
    setTimeout(() => toastEl.remove(), 4000);
}

// Debounce Funktion für Auto-Save
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Wörter und Lesezeit zählen
function countWords(text) {
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

function calculateReadingTime(words) {
    return Math.max(1, Math.ceil(words / 200));
}

// Status-Label übersetzen
function getStatusLabel(status) {
    const labels = {
        draft: 'Entwurf',
        scheduled: 'Geplant',
        published: 'Veröffentlicht',
        publishing: 'Wird veröffentlicht'
    };
    return labels[status] || status;
}
