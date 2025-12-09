/**
 * Sticky Notes Module
 * Notizen-System für Feedback und Kommentare
 * @module notes
 */

import { state } from './state.js';
import { saveToLocalBackup } from './storage.js';
import { escapeHtml } from './security.js';
import { toast } from './ui.js';

let notesFilter = 'current';

/**
 * Erstellt eine neue Sticky Note
 * @param {number} x - X-Position
 * @param {number} y - Y-Position
 * @param {string} text - Initialer Text
 */
export function createStickyNote(x = 100, y = 100, text = '') {
    const id = 'note-' + Date.now();

    const note = {
        id,
        x,
        y,
        text,
        page: state.currentPage,
        created: Date.now(),
        minimized: false
    };

    state.stickyNotes = [...state.stickyNotes, note];
    saveToLocalBackup();

    renderStickyNote(note);
    toast('Notiz erstellt', 'success');

    return id;
}

/**
 * Rendert eine einzelne Sticky Note
 * @param {Object} note - Note-Objekt
 */
function renderStickyNote(note) {
    const existing = document.getElementById(note.id);
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.id = note.id;
    div.className = 'sticky-note' + (note.minimized ? ' minimized' : '');
    div.style.left = note.x + 'px';
    div.style.top = note.y + 'px';

    div.innerHTML = `
        <div class="sticky-note-header">
            <span style="font-size:0.7rem;color:#999;">Notiz</span>
            <div class="sticky-note-header-btns">
                <button class="sticky-note-minimize" onclick="window.CMS.toggleNoteMinimize('${note.id}')">−</button>
                <button class="sticky-note-close" onclick="window.CMS.removeStickyNote('${note.id}')">&times;</button>
            </div>
        </div>
        <textarea class="sticky-note-content"
                  placeholder="Notiz hier eingeben..."
                  onchange="window.CMS.updateNoteText('${note.id}', this.value)">${escapeHtml(note.text)}</textarea>
    `;

    // Dragging
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };

    div.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON') return;
        isDragging = true;
        dragOffset.x = e.clientX - div.offsetLeft;
        dragOffset.y = e.clientY - div.offsetTop;
        div.style.zIndex = '99999';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        div.style.left = (e.clientX - dragOffset.x) + 'px';
        div.style.top = (e.clientY - dragOffset.y) + 'px';
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            div.style.zIndex = '99990';

            // Position speichern
            const noteIdx = state.stickyNotes.findIndex(n => n.id === note.id);
            if (noteIdx >= 0) {
                state.stickyNotes[noteIdx].x = parseInt(div.style.left);
                state.stickyNotes[noteIdx].y = parseInt(div.style.top);
                saveToLocalBackup();
            }
        }
    });

    // Klick auf minimierte Notiz zum Maximieren
    div.addEventListener('click', (e) => {
        if (div.classList.contains('minimized') && e.target === div) {
            toggleNoteMinimize(note.id);
        }
    });

    document.body.appendChild(div);
}

/**
 * Aktualisiert Notiz-Text
 * @param {string} id - Note ID
 * @param {string} text - Neuer Text
 */
export function updateNoteText(id, text) {
    const noteIdx = state.stickyNotes.findIndex(n => n.id === id);
    if (noteIdx >= 0) {
        state.stickyNotes[noteIdx].text = text;
        saveToLocalBackup();
    }
}

/**
 * Toggle Notiz-Minimierung
 * @param {string} id - Note ID
 */
export function toggleNoteMinimize(id) {
    const noteIdx = state.stickyNotes.findIndex(n => n.id === id);
    if (noteIdx >= 0) {
        state.stickyNotes[noteIdx].minimized = !state.stickyNotes[noteIdx].minimized;
        saveToLocalBackup();

        const div = document.getElementById(id);
        if (div) {
            div.classList.toggle('minimized');
        }
    }
}

/**
 * Entfernt eine Sticky Note
 * @param {string} id - Note ID
 */
export function removeStickyNote(id) {
    state.stickyNotes = state.stickyNotes.filter(n => n.id !== id);
    saveToLocalBackup();

    const div = document.getElementById(id);
    if (div) div.remove();

    renderNotesList(notesFilter);
    toast('Notiz gelöscht', 'success');
}

/**
 * Scrollt zu einer Notiz
 * @param {string} id - Note ID
 */
export function scrollToNote(id) {
    const note = state.stickyNotes.find(n => n.id === id);
    if (!note) return;

    // Wenn Notiz nicht existiert, rendere sie
    let div = document.getElementById(id);
    if (!div) {
        renderStickyNote(note);
        div = document.getElementById(id);
    }

    // Notiz maximieren falls minimiert
    if (note.minimized) {
        toggleNoteMinimize(id);
    }

    // Scroll in View
    div?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Toggle Notizen-Sidebar
 */
export function toggleNotesSidebar() {
    const sidebar = document.getElementById('notesSidebar');
    const versionsSidebar = document.getElementById('versionsSidebar');

    if (!sidebar) return;

    // Andere Sidebar schließen
    if (versionsSidebar?.classList.contains('open')) {
        versionsSidebar.classList.remove('open');
    }

    sidebar.classList.toggle('open');

    if (sidebar.classList.contains('open')) {
        renderNotesList('current');
    }
}

/**
 * Filtert Notizen
 * @param {string} filter - 'current' oder 'all'
 */
export function filterNotes(filter) {
    notesFilter = filter;

    const currentBtn = document.getElementById('notesFilterCurrent');
    const allBtn = document.getElementById('notesFilterAll');

    if (filter === 'current') {
        currentBtn?.classList.add('btn-primary');
        currentBtn?.classList.remove('btn-ghost');
        allBtn?.classList.remove('btn-primary');
        allBtn?.classList.add('btn-ghost');
    } else {
        allBtn?.classList.add('btn-primary');
        allBtn?.classList.remove('btn-ghost');
        currentBtn?.classList.remove('btn-primary');
        currentBtn?.classList.add('btn-ghost');
    }

    renderNotesList(filter);
}

/**
 * Rendert Notizen-Liste in Sidebar
 * @param {string} filter - 'current' oder 'all'
 */
export function renderNotesList(filter) {
    const container = document.getElementById('notesListContainer');
    if (!container) return;

    let notes = state.stickyNotes || [];

    if (filter === 'current' && state.currentPage) {
        notes = notes.filter(n => n.page === state.currentPage || !n.page);
    }

    if (notes.length === 0) {
        container.innerHTML = `
            <p style="color:#999;font-size:0.85rem;text-align:center;padding:2rem 0;">
                ${filter === 'current' ? 'Keine Notizen auf dieser Seite' : 'Noch keine Notizen'}
            </p>
        `;
        return;
    }

    // Nach Seiten gruppieren wenn "alle"
    if (filter === 'all') {
        const notesByPage = {};
        notes.forEach(note => {
            const page = note.page || 'Allgemein';
            if (!notesByPage[page]) notesByPage[page] = [];
            notesByPage[page].push(note);
        });

        let html = '';
        for (const [page, pageNotes] of Object.entries(notesByPage)) {
            html += `<div style="font-weight:600;color:#2C4A47;margin:1rem 0 0.5rem;font-size:0.85rem;border-bottom:1px solid #ddd;padding-bottom:0.25rem;">${escapeHtml(page)}</div>`;
            pageNotes.forEach(note => {
                html += renderNoteItem(note);
            });
        }
        container.innerHTML = html;
    } else {
        container.innerHTML = notes.map(note => renderNoteItem(note)).join('');
    }
}

/**
 * Rendert einzelnes Notiz-Item für Liste
 * @param {Object} note - Note-Objekt
 * @returns {string} HTML
 */
function renderNoteItem(note) {
    const text = note.text || 'Leere Notiz';
    const truncated = text.length > 50 ? text.substring(0, 50) + '...' : text;

    return `
        <div class="note-list-item" onclick="window.CMS.scrollToNote('${note.id}')"
             style="background:#fff9c4;padding:0.5rem;border-radius:4px;margin-bottom:0.5rem;cursor:pointer;font-size:0.8rem;display:flex;justify-content:space-between;align-items:center;">
            <span style="flex:1;">${escapeHtml(truncated)}</span>
            <button onclick="event.stopPropagation();window.CMS.removeStickyNote('${note.id}')"
                    style="background:none;border:none;color:#999;cursor:pointer;font-size:1rem;">&times;</button>
        </div>
    `;
}

/**
 * Rendert Notiz-Marker auf der Seite
 */
export function renderNoteMarkers() {
    // Alte Marker entfernen
    document.querySelectorAll('.note-marker').forEach(m => m.remove());

    const pageNotes = state.stickyNotes.filter(n =>
        n.page === state.currentPage && n.minimized
    );

    pageNotes.forEach(note => {
        const marker = document.createElement('div');
        marker.className = 'note-marker';
        marker.style.left = note.x + 'px';
        marker.style.top = note.y + 'px';
        marker.innerHTML = '📝';
        marker.onclick = () => scrollToNote(note.id);
        document.body.appendChild(marker);
    });
}
