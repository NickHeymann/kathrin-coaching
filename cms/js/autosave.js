/**
 * Autosave System
 * Automatisches Speichern und Offline-Synchronisation
 * @module autosave
 */

import { CONFIG } from './config.js';
import { state, clearPendingChanges } from './state.js';
import { github } from './github-api.js';
import { saveToLocalBackup, clearLocalBackup } from './storage.js';
import { toast, updateStatus, updateChangesList } from './ui.js';

let autosaveTimer = null;

/**
 * Startet Autosave-Timer
 */
export function startAutosave() {
    if (autosaveTimer) {
        clearInterval(autosaveTimer);
    }

    autosaveTimer = setInterval(async () => {
        if (state.hasUnsavedChanges && !state.isSaving) {
            await saveChanges(true);
        }
    }, CONFIG.autosaveInterval);
}

/**
 * Stoppt Autosave-Timer
 */
export function stopAutosave() {
    if (autosaveTimer) {
        clearInterval(autosaveTimer);
        autosaveTimer = null;
    }
}

/**
 * Speichert alle Änderungen
 * @param {boolean} isAutosave - True wenn automatisch gespeichert
 * @param {Function} onComplete - Callback nach Abschluss
 */
export async function saveChanges(isAutosave = false, onComplete = null) {
    if (!state.currentPage || state.pendingChanges.length === 0) return;
    if (state.isSaving) return;

    // Offline-Modus: In Queue speichern
    if (state.isOffline) {
        state.offlineQueue.push({
            type: 'save',
            page: state.currentPage,
            changes: [...state.pendingChanges],
            timestamp: Date.now()
        });
        saveToLocalBackup();
        toast('Änderungen werden gespeichert sobald du online bist', 'info');
        return;
    }

    state.isSaving = true;
    updateStatus('saving');

    try {
        // Bilder hochladen
        for (const change of state.pendingChanges) {
            if (change.type === 'image' && change.newData) {
                await github.uploadImage(change.newFile, change.newData);
                delete change.newData;
            }
        }

        // HTML aus iframe holen und bereinigen
        const html = getCleanHtml();
        if (!html) {
            throw new Error('Konnte HTML nicht extrahieren');
        }

        // Commit message erstellen
        const changeCount = state.pendingChanges.length;
        const message = isAutosave
            ? `Autosave: ${changeCount} Änderung${changeCount > 1 ? 'en' : ''} an ${state.currentPage}`
            : `${changeCount} Änderung${changeCount > 1 ? 'en' : ''} an ${state.currentPage}`;

        // Auf GitHub speichern
        await github.saveFile(state.currentPage, html, message);

        // State aktualisieren
        clearPendingChanges();
        updateStatus('saved');
        updateChangesList();
        clearLocalBackup();

        toast(isAutosave ? 'Automatisch gespeichert' : 'Gespeichert!', 'success');

        if (onComplete) onComplete(true);

    } catch (e) {
        console.error('Speichern fehlgeschlagen:', e);
        updateStatus('error');
        toast('Speichern fehlgeschlagen: ' + e.message, 'error');

        if (onComplete) onComplete(false);
    }

    state.isSaving = false;
}

/**
 * Extrahiert und bereinigt HTML aus dem iframe
 * @returns {string|null}
 */
function getCleanHtml() {
    const frame = document.getElementById('siteFrame');
    if (!frame?.contentDocument) return null;

    const doc = frame.contentDocument;

    // Editor-Styles entfernen
    const editorStyle = doc.getElementById('editor-styles');
    if (editorStyle) editorStyle.remove();

    // data-* Attribute entfernen
    const cleanupSelectors = [
        '[data-editing]',
        '[data-changed]',
        '[data-edit-idx]',
        '[data-edit-orig]'
    ];

    doc.querySelectorAll(cleanupSelectors.join(',')).forEach(el => {
        el.removeAttribute('data-editing');
        el.removeAttribute('data-changed');
        el.removeAttribute('data-edit-idx');
        el.removeAttribute('data-edit-orig');
        el.removeAttribute('contenteditable');
    });

    // Video overlays entfernen
    doc.querySelectorAll('.video-overlay').forEach(el => el.remove());

    // HTML zusammenbauen
    let html = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;

    // CDN URLs zurück zu relativen Pfaden konvertieren (sourceBranch wurde beim Laden verwendet)
    const cdnUrl = `https://cdn.jsdelivr.net/gh/${CONFIG.owner}/${CONFIG.repo}@${CONFIG.sourceBranch}/`;
    html = html.replace(new RegExp(cdnUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');

    // Cache-Busting Parameter entfernen
    html = html.replace(/\?v=\d+/g, '');

    return html;
}

/**
 * Manuelles Speichern
 */
export function saveNow() {
    if (state.pendingChanges.length === 0) {
        toast('Keine Änderungen zum Speichern', 'info');
        return;
    }
    saveChanges(false);
}

/**
 * Richtet Offline-Erkennung ein
 */
export function setupOfflineDetection() {
    window.addEventListener('online', () => {
        state.isOffline = false;
        const banner = document.getElementById('offlineBanner');
        if (banner) banner.classList.remove('active');

        toast('Wieder online!', 'success');
        syncOfflineQueue();
    });

    window.addEventListener('offline', () => {
        state.isOffline = true;
        const banner = document.getElementById('offlineBanner');
        if (banner) banner.classList.add('active');

        toast('Du bist offline. Änderungen werden lokal gespeichert.', 'info');
    });

    // Initial check
    if (!navigator.onLine) {
        state.isOffline = true;
        const banner = document.getElementById('offlineBanner');
        if (banner) banner.classList.add('active');
    }
}

/**
 * Synchronisiert Offline-Queue
 */
async function syncOfflineQueue() {
    if (state.offlineQueue.length === 0) return;

    toast(`Synchronisiere ${state.offlineQueue.length} Offline-Änderungen...`, 'info');

    for (const item of state.offlineQueue) {
        try {
            if (item.type === 'save' && item.page) {
                // Hole aktuellen HTML-Stand
                const frame = document.getElementById('siteFrame');
                if (frame?.contentDocument) {
                    const html = getCleanHtml();
                    if (html) {
                        await github.saveFile(
                            item.page,
                            html,
                            `Offline-Sync: ${item.changes?.length || 0} Änderungen`
                        );
                    }
                }
            }
        } catch (e) {
            console.error('Sync fehlgeschlagen:', e);
            toast('Einige Änderungen konnten nicht synchronisiert werden', 'error');
            return;
        }
    }

    state.offlineQueue = [];
    saveToLocalBackup();
    toast('Alle Änderungen synchronisiert!', 'success');
}
