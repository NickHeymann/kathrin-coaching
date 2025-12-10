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

// ============================================
// BILD-KOMPRIMIERUNG
// ============================================

/**
 * Komprimiert ein Bild auf eine maximale Größe
 * @param {string} base64Data - Bild als Base64 (mit oder ohne Data-URL Prefix)
 * @param {Object} options - Komprimierungsoptionen
 * @returns {Promise<string>} Komprimiertes Bild als Base64
 */
async function compressImage(base64Data, options = {}) {
    const {
        maxWidth = 1920,
        maxHeight = 1080,
        quality = 0.8,
        format = 'jpeg' // 'jpeg' oder 'webp'
    } = options;

    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
            // Berechne neue Dimensionen (Seitenverhältnis beibehalten)
            let { width, height } = img;

            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
            }

            // Canvas erstellen und Bild zeichnen
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(width);
            canvas.height = Math.round(height);

            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // In komprimiertes Format konvertieren
            const mimeType = format === 'webp' ? 'image/webp' : 'image/jpeg';
            const compressed = canvas.toDataURL(mimeType, quality);

            resolve(compressed);
        };

        img.onerror = () => reject(new Error('Bild konnte nicht geladen werden'));

        // Data URL Prefix hinzufügen falls nötig
        if (!base64Data.startsWith('data:')) {
            img.src = 'data:image/jpeg;base64,' + base64Data;
        } else {
            img.src = base64Data;
        }
    });
}

/**
 * Komprimiert ein File-Objekt und gibt Base64 zurück
 * @param {File} file - Das Bild-File-Objekt
 * @param {Object} options - Komprimierungsoptionen
 * @returns {Promise<Object>} { original: base64, compressed: base64, savings: percentage }
 */
async function compressImageFile(file, options = {}) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
            const original = e.target.result;
            const originalSize = original.length;

            try {
                // Prüfe ob Komprimierung sinnvoll ist (nur für große Bilder)
                if (file.size < 100 * 1024) { // < 100KB
                    resolve({
                        original,
                        compressed: original,
                        savings: 0,
                        skipped: true
                    });
                    return;
                }

                const compressed = await compressImage(original, options);
                const compressedSize = compressed.length;
                const savings = Math.round((1 - compressedSize / originalSize) * 100);

                resolve({
                    original,
                    compressed,
                    savings,
                    skipped: false
                });
            } catch (err) {
                reject(err);
            }
        };

        reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'));
        reader.readAsDataURL(file);
    });
}

/**
 * Formatiert Dateigrößen lesbar
 */
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Berechnet ungefähre Größe einer Base64-Zeichenkette
 */
function getBase64Size(base64) {
    const base64Length = base64.length - (base64.indexOf(',') + 1);
    return Math.round((base64Length * 3) / 4);
}

// Export für globale Nutzung
window.compressImage = compressImage;
window.compressImageFile = compressImageFile;
window.formatFileSize = formatFileSize;
window.getBase64Size = getBase64Size;

console.log('✓ blog-editor-utils.js geladen (mit Bild-Komprimierung)');
