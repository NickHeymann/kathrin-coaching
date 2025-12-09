/**
 * Version History Module
 * Git-basierte Versionierung und Rollback
 * @module versions
 */

import { state } from './state.js';
import { github } from './github-api.js';
import { escapeHtml } from './security.js';
import { toast } from './ui.js';

/**
 * Lädt Commit-History von GitHub
 */
export async function loadVersions() {
    try {
        const commits = await github.getCommits();
        state.versions = commits;
        renderVersions();
    } catch (e) {
        console.error('Fehler beim Laden der Versionen:', e);
    }
}

/**
 * Rendert Versionsliste in der Sidebar
 */
export function renderVersions() {
    const list = document.getElementById('versionList');
    if (!list) return;

    if (state.versions.length === 0) {
        list.innerHTML = '<p style="color:#999;font-size:0.85rem;">Keine Versionen gefunden</p>';
        return;
    }

    list.innerHTML = state.versions.slice(0, 5).map((v, i) => {
        const date = new Date(v.commit.author.date);
        const dateStr = date.toLocaleDateString('de') + ' ' +
            date.toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit' });

        const safeMessage = escapeHtml(v.commit.message);
        const truncatedMsg = safeMessage.length > 50
            ? safeMessage.substring(0, 50) + '...'
            : safeMessage;

        return `
            <div class="version-item ${i === 0 ? 'current' : ''}"
                 onclick="window.CMS.selectVersion('${escapeHtml(v.sha)}', '${escapeHtml(dateStr)}', '${safeMessage.replace(/'/g, "\\'")}')">
                <div class="version-date">${escapeHtml(dateStr)}</div>
                <div class="version-msg">${truncatedMsg}</div>
            </div>
        `;
    }).join('');
}

/**
 * Wählt eine Version zur Vorschau aus
 * @param {string} sha - Commit SHA
 * @param {string} dateStr - Formatiertes Datum
 * @param {string} message - Commit-Message
 */
export function selectVersion(sha, dateStr, message) {
    state.selectedVersion = { sha, dateStr, message };
    toast(`Version vom ${dateStr} ausgewählt`, 'info');

    // Hier könnte Vorschau oder Vergleich implementiert werden
}

/**
 * Zeigt Versionen-Sidebar
 */
export function showVersions() {
    toggleVersionsSidebar();
}

/**
 * Toggle Versionen-Sidebar
 */
export function toggleVersionsSidebar() {
    const sidebar = document.getElementById('versionsSidebar');
    const notesSidebar = document.getElementById('notesSidebar');

    if (!sidebar) return;

    // Andere Sidebar schließen
    if (notesSidebar?.classList.contains('open')) {
        notesSidebar.classList.remove('open');
    }

    sidebar.classList.toggle('open');

    if (sidebar.classList.contains('open')) {
        loadVersions();
    }
}

/**
 * Schließt Sidebar
 * @param {string} sidebarId - ID der Sidebar
 */
export function closeSidebar(sidebarId) {
    const sidebar = document.getElementById(sidebarId);
    if (sidebar) {
        sidebar.classList.remove('open');
    }
}

/**
 * Lädt Datei bei spezifischem Commit
 * @param {string} sha - Commit SHA
 * @returns {Promise<string>}
 */
export async function getVersionContent(sha) {
    if (!state.currentPage) {
        throw new Error('Keine Seite geladen');
    }
    return github.getFileAtCommit(state.currentPage, sha);
}

/**
 * Stellt eine frühere Version wieder her
 * @param {string} sha - Commit SHA
 */
export async function restoreVersion(sha) {
    if (!state.currentPage) {
        toast('Keine Seite geladen', 'error');
        return;
    }

    if (!confirm('Möchtest du diese Version wirklich wiederherstellen? Aktuelle Änderungen gehen verloren.')) {
        return;
    }

    try {
        toast('Version wird wiederhergestellt...', 'info');

        const content = await getVersionContent(sha);
        await github.saveFile(
            state.currentPage,
            content,
            `Version wiederhergestellt von ${sha.substring(0, 7)}`
        );

        toast('Version wiederhergestellt!', 'success');

        // Seite neu laden
        window.location.reload();

    } catch (e) {
        console.error('Wiederherstellung fehlgeschlagen:', e);
        toast('Wiederherstellung fehlgeschlagen: ' + e.message, 'error');
    }
}
