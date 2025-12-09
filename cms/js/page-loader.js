/**
 * Page Loading System
 * Lädt und verarbeitet Seiten für den Editor
 * @module page-loader
 */

import { CONFIG } from './config.js';
import { state } from './state.js';
import { github } from './github-api.js';
import { pageCache, cachePage } from './storage.js';
import { toast, updateStatus, updateChangesList, showLoading, showStartScreen } from './ui.js';

/**
 * Fixiert relative URLs für GitHub-Hosting
 * @param {string} html - HTML-Content
 * @returns {string} HTML mit absoluten URLs
 */
export function fixRelativeUrls(html) {
    const cacheBust = Date.now();
    // Lade Assets von sourceBranch (Live-Website)
    const baseUrl = `https://raw.githubusercontent.com/${CONFIG.owner}/${CONFIG.repo}/${CONFIG.sourceBranch}/`;
    const cdnUrl = `https://cdn.jsdelivr.net/gh/${CONFIG.owner}/${CONFIG.repo}@${CONFIG.sourceBranch}/`;

    // CSS-Dateien (relativ)
    html = html.replace(/href="([^"]+\.css)"/g, (m, url) => {
        if (url.startsWith('http') || url.startsWith('//') || url.startsWith('#')) return m;
        return `href="${cdnUrl}${url}?v=${cacheBust}"`;
    });

    // JS-Dateien (relativ)
    html = html.replace(/src="([^"]+\.js)"/g, (m, url) => {
        if (url.startsWith('http') || url.startsWith('//')) return m;
        return `src="${cdnUrl}${url}?v=${cacheBust}"`;
    });

    // Alle Bilder mit src-Attribut (wp-content, images, etc.)
    html = html.replace(/src="((?:wp-content|images|assets|img)[^"]+)"/gi, (m, url) => {
        if (url.startsWith('http')) return m;
        return `src="${cdnUrl}${url}?v=${cacheBust}"`;
    });

    // Background URLs in CSS (inline styles und style-Blöcke)
    // Erfasst: url('wp-content/...'), url("wp-content/..."), url(wp-content/...)
    html = html.replace(/url\(\s*['"]?((?:wp-content|images|assets|img)[^'")]+)['"]?\s*\)/gi, (m, url) => {
        if (url.startsWith('http')) return m;
        return `url('${cdnUrl}${url}?v=${cacheBust}')`;
    });

    // Füge base-Tag ein für alle anderen relativen Links
    if (html.includes('<head>')) {
        const baseTag = `<base href="${cdnUrl}">`;
        html = html.replace('<head>', `<head>\n    ${baseTag}`);
    }

    return html;
}

/**
 * Injiziert Editor-Styles in die Seite
 * @param {string} html - HTML-Content
 * @returns {string} HTML mit Editor-Styles
 */
export function injectEditorCode(html) {
    const editorStyles = `
        <style id="editor-styles">
            h1,h2,h3,h4,h5,h6,p,span,li,td,th,label,a,button,.btn,.nav-cta {
                transition: outline 0.15s !important;
            }
            h1:hover,h2:hover,h3:hover,h4:hover,h5:hover,h6:hover,
            p:hover,li:hover,label:hover,button:hover,span:hover,td:hover,th:hover,
            a:hover,.btn:hover,.nav-cta:hover {
                outline: 2px dashed #D4A574 !important;
                outline-offset: 3px !important;
                cursor: text !important;
            }
            .btn:hover,.nav-cta:hover,a.btn:hover {
                outline: 3px dashed #2196F3 !important;
                outline-offset: 4px !important;
            }
            [data-editing] {
                outline: 2px solid #D4A574 !important;
                outline-offset: 2px !important;
            }
            [data-changed] {
                outline: 2px solid #4CAF50 !important;
                outline-offset: 2px !important;
            }
            img {
                transition: outline 0.15s !important;
                cursor: pointer !important;
            }
            img:hover {
                outline: 3px solid #2196F3 !important;
                outline-offset: 3px !important;
            }
            img[data-changed] {
                outline: 3px solid #4CAF50 !important;
            }
            .video-overlay {
                position: absolute;
                inset: 0;
                cursor: pointer;
                z-index: 10;
                transition: background 0.15s;
            }
            .video-overlay:hover {
                background: rgba(156, 39, 176, 0.2);
            }
        </style>
    `;

    if (html.includes('</head>')) {
        return html.replace('</head>', editorStyles + '</head>');
    }
    return editorStyles + html;
}

/**
 * Lädt eine Seite in den Editor
 * @param {string} page - Seitenname
 * @param {boolean} forceRefresh - Cache ignorieren
 * @param {Function} setupCallback - Callback für Frame-Setup
 */
export async function loadPage(page, forceRefresh = true, setupCallback = null) {
    if (!page) return;

    // Warnung bei ungespeicherten Änderungen
    if (state.hasUnsavedChanges) {
        if (!confirm('Es gibt ungespeicherte Änderungen. Trotzdem Seite wechseln?')) {
            const select = document.getElementById('pageSelect');
            if (select) select.value = state.currentPage || '';
            return;
        }
    }

    showStartScreen(false);
    showLoading(true);

    state.currentPage = page;
    state.pendingChanges = [];
    state.hasUnsavedChanges = false;
    updateStatus('saved');
    updateChangesList();

    try {
        // Lade HTML von sourceBranch (Live-Website)
        const rawUrl = `https://raw.githubusercontent.com/${CONFIG.owner}/${CONFIG.repo}/${CONFIG.sourceBranch}/${page}`;

        const [htmlResponse] = await Promise.all([
            fetch(rawUrl + '?t=' + Date.now(), { cache: 'no-store' }),
            github.getFile(page).catch(() => {})  // Holt SHA für Speichern
        ]);

        if (!htmlResponse.ok) {
            throw new Error('Seite nicht gefunden');
        }

        let html = await htmlResponse.text();
        state.originalContent[page] = html;

        // URLs fixieren und Editor-Code einfügen
        html = fixRelativeUrls(html);
        html = injectEditorCode(html);

        // In iframe laden
        const frame = document.getElementById('siteFrame');
        if (frame) {
            frame.srcdoc = html;

            frame.onload = () => {
                if (setupCallback) {
                    setupCallback(frame);
                }
                showLoading(false);
                toast('Seite geladen', 'success');
            };
        }

    } catch (e) {
        console.error(e);
        showLoading(false);
        showStartScreen(true);

        const select = document.getElementById('pageSelect');
        if (select) select.value = '';
        state.currentPage = null;

        toast('Seite nicht gefunden. Bitte wähle eine andere Seite.', 'error');
    }
}

/**
 * Preloads alle verfügbaren Seiten im Hintergrund
 */
export async function preloadPages() {
    const select = document.getElementById('pageSelect');
    if (!select) return;

    const pages = Array.from(select.options)
        .filter(opt => opt.value && opt.value !== '')
        .map(opt => opt.value);

    for (const page of pages) {
        if (pageCache.has(page)) continue;

        try {
            // Preload von sourceBranch (Live-Website)
            const rawUrl = `https://raw.githubusercontent.com/${CONFIG.owner}/${CONFIG.repo}/${CONFIG.sourceBranch}/${page}`;
            const response = await fetch(rawUrl);

            if (response.ok) {
                const content = await response.text();
                cachePage(page, content);
            }
        } catch (e) {
            // Fehler ignorieren
        }

        await new Promise(r => setTimeout(r, 100));
    }

    console.log('Preload abgeschlossen:', pageCache.size, 'Seiten');
}
