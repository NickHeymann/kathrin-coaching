/**
 * Context Menu Module
 * Rechtsklick-Kontextmenü
 * @module context-menu
 */

import { createStickyNote } from './notes.js';

/**
 * Zeigt Kontextmenü
 * @param {number} x - X-Position
 * @param {number} y - Y-Position
 * @param {boolean} hasHistory - Hat Element eine Edit-History
 * @param {boolean} hasBackground - Hat Element ein Background-Image
 */
export function showContextMenu(x, y, hasHistory = false, hasBackground = false) {
    const menu = document.getElementById('contextMenu');
    if (!menu) return;

    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    menu.classList.add('active');

    // History-Option nur anzeigen wenn verfügbar
    const historyItem = menu.querySelector('[data-action="history"]');
    if (historyItem) {
        historyItem.style.display = hasHistory ? 'flex' : 'none';
    }

    // Background-Option nur anzeigen wenn verfügbar
    const backgroundItem = menu.querySelector('[data-action="background"]');
    if (backgroundItem) {
        backgroundItem.style.display = hasBackground ? 'flex' : 'none';
    }

    // Klick außerhalb schließt Menü (auch im iframe)
    const closeHandler = (e) => {
        if (!menu.contains(e.target)) {
            hideContextMenu();
            document.removeEventListener('click', closeHandler);
            // Auch iframe-Listener entfernen
            const frame = document.getElementById('siteFrame');
            if (frame?.contentDocument) {
                frame.contentDocument.removeEventListener('click', closeHandler);
            }
        }
    };

    setTimeout(() => {
        document.addEventListener('click', closeHandler);
        // Auch Klicks im iframe erfassen
        const frame = document.getElementById('siteFrame');
        if (frame?.contentDocument) {
            frame.contentDocument.addEventListener('click', closeHandler);
        }
    }, 0);
}

/**
 * Versteckt Kontextmenü
 */
export function hideContextMenu() {
    const menu = document.getElementById('contextMenu');
    if (menu) {
        menu.classList.remove('active');
    }
}

/**
 * Erstellt Notiz aus Kontextmenü
 */
export function createNoteFromContext() {
    const data = window.contextMenuData;
    if (data) {
        createStickyNote(data.x, data.y, '');
    }
    hideContextMenu();
}

/**
 * Zeigt Element-History aus Kontextmenü
 */
export function showElementHistoryFromContext() {
    const data = window.contextMenuData;
    if (data && data.editIdx) {
        showElementHistory(data.editIdx, data.x, data.y);
    }
    hideContextMenu();
}

/**
 * Zeigt History-Panel für ein Element
 * @param {string} idx - Element-Index
 * @param {number} x - X-Position
 * @param {number} y - Y-Position
 */
export function showElementHistory(idx, x, y) {
    import('./state.js').then(({ state }) => {
        const history = state.elementHistory[idx] || [];
        const panel = document.getElementById('elementHistory');
        if (!panel) return;

        if (history.length === 0) {
            import('./ui.js').then(({ toast }) => {
                toast('Keine Änderungshistorie für dieses Element', 'info');
            });
            return;
        }

        panel.innerHTML = `
            <h5>Änderungsverlauf</h5>
            ${history.slice(-5).reverse().map(h => {
                const time = new Date(h.timestamp).toLocaleTimeString('de', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                const preview = h.type === 'text'
                    ? h.newVal?.substring(0, 30) || ''
                    : h.type;
                return `
                    <div class="history-item" onclick="window.CMS.restoreElementValue('${idx}', '${h.timestamp}')">
                        <div class="history-item-time">${time}</div>
                        <div>${preview}${preview.length >= 30 ? '...' : ''}</div>
                    </div>
                `;
            }).join('')}
        `;

        panel.style.left = x + 'px';
        panel.style.top = y + 'px';
        panel.classList.add('active');

        // Klick außerhalb schließt Panel
        const closeHandler = (e) => {
            if (!panel.contains(e.target)) {
                panel.classList.remove('active');
                document.removeEventListener('click', closeHandler);
            }
        };

        setTimeout(() => {
            document.addEventListener('click', closeHandler);
        }, 0);
    });
}

/**
 * Stellt Element-Wert aus History wieder her
 * @param {string} idx - Element-Index
 * @param {string} timestamp - Timestamp der Version
 */
export function restoreElementValue(idx, timestamp) {
    import('./state.js').then(({ state }) => {
        const history = state.elementHistory[idx] || [];
        const entry = history.find(h => String(h.timestamp) === String(timestamp));

        if (!entry) return;

        const frame = document.getElementById('siteFrame');
        if (!frame?.contentDocument) return;

        const el = frame.contentDocument.querySelector(`[data-edit-idx="${idx}"]`);
        if (el && entry.type === 'text') {
            el.textContent = entry.orig;
            el.removeAttribute('data-changed');
        }

        // Panel schließen
        const panel = document.getElementById('elementHistory');
        if (panel) panel.classList.remove('active');

        import('./ui.js').then(({ toast }) => {
            toast('Wert wiederhergestellt', 'success');
        });
    });
}

/**
 * Öffnet Background-Editor aus Kontextmenü
 */
export function editBackgroundFromContext() {
    const data = window.contextMenuData;
    if (data && data.element) {
        import('./background-editor.js').then(({ editBackground }) => {
            editBackground(data.element);
        });
    }
    hideContextMenu();
}
