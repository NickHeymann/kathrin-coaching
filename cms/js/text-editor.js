/**
 * Text Editor Module
 * Inline-Text-Editing Funktionalität
 * @module text-editor
 */

import { state, addPendingChange } from './state.js';
import { toast, updateStatus, updateChangesList } from './ui.js';
import { saveToLocalBackup } from './storage.js';

let activeElement = null;

/**
 * Aktiviert Text-Editing für ein Element
 * @param {HTMLElement} el - Zu bearbeitendes Element
 * @param {MouseEvent} clickEvent - Ursprüngliches Klick-Event
 */
export function editText(el, clickEvent) {
    if (activeElement) {
        activeElement.removeAttribute('data-editing');
        activeElement.contentEditable = 'false';
    }

    activeElement = el;
    el.setAttribute('data-editing', 'true');
    el.contentEditable = 'true';
    el.focus();

    // Cursor an Klickposition setzen
    setCursorAtClick(el, clickEvent);

    el.onblur = () => finishTextEdit(el);
    el.onkeydown = (e) => handleTextKeydown(e, el);
}

/**
 * Setzt Cursor an Klickposition
 * @param {HTMLElement} el - Element
 * @param {MouseEvent} event - Klick-Event
 */
function setCursorAtClick(el, event) {
    if (!event) return;

    const doc = el.ownerDocument;

    // Firefox
    if (doc.caretPositionFromPoint) {
        const pos = doc.caretPositionFromPoint(event.clientX, event.clientY);
        if (pos) {
            const range = doc.createRange();
            range.setStart(pos.offsetNode, pos.offset);
            range.collapse(true);
            const sel = doc.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
            return;
        }
    }

    // Chrome, Safari
    if (doc.caretRangeFromPoint) {
        const range = doc.caretRangeFromPoint(event.clientX, event.clientY);
        if (range) {
            const sel = doc.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
            return;
        }
    }

    // Fallback: Cursor ans Ende
    const range = doc.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = doc.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
}

/**
 * Keyboard-Handler für Text-Editing
 * @param {KeyboardEvent} e - Event
 * @param {HTMLElement} el - Element
 */
function handleTextKeydown(e, el) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        el.blur();
    }
    if (e.key === 'Escape') {
        el.textContent = el.dataset.editOrig;
        el.blur();
    }
}

/**
 * Beendet Text-Editing und speichert Änderung
 * @param {HTMLElement} el - Element
 */
export function finishTextEdit(el) {
    el.removeAttribute('data-editing');
    el.contentEditable = 'false';

    const orig = el.dataset.editOrig;
    const newVal = el.textContent.trim();

    if (newVal !== orig) {
        el.setAttribute('data-changed', 'true');

        const change = {
            type: 'text',
            idx: el.dataset.editIdx,
            tag: el.tagName,
            orig,
            newVal,
            page: state.currentPage,
            timestamp: Date.now()
        };

        addPendingChange(change);
        updateStatus('unsaved');
        updateChangesList();

        // History und Backup
        addToUndoStack(change);
        addToElementHistory(el.dataset.editIdx, change);
        saveToLocalBackup();

        toast('Text geändert', 'success');
    }

    activeElement = null;
}

/**
 * Fügt Änderung zum Undo-Stack hinzu
 * @param {Object} change - Change-Objekt
 */
export function addToUndoStack(change) {
    state.undoStack = [...state.undoStack, change];
    state.redoStack = [];
}

/**
 * Fügt Änderung zur Element-History hinzu
 * @param {string} idx - Element-Index
 * @param {Object} change - Change-Objekt
 */
export function addToElementHistory(idx, change) {
    if (!state.elementHistory[idx]) {
        state.elementHistory[idx] = [];
    }
    state.elementHistory[idx].push(change);
}

/**
 * Undo letzte Änderung
 */
export function undo() {
    if (state.undoStack.length === 0) {
        toast('Nichts zum Rückgängig machen', 'info');
        return;
    }

    const lastChange = state.undoStack.pop();
    state.redoStack = [...state.redoStack, lastChange];

    // Änderung rückgängig machen (im Frame)
    const frame = document.getElementById('siteFrame');
    if (!frame?.contentDocument) return;

    const doc = frame.contentDocument;
    const el = doc.querySelector(`[data-edit-idx="${lastChange.idx}"]`);

    if (el && lastChange.type === 'text') {
        el.textContent = lastChange.orig;
        el.removeAttribute('data-changed');
    }

    // Aus pendingChanges entfernen
    state.pendingChanges = state.pendingChanges.filter(c =>
        !(c.idx === lastChange.idx && c.timestamp === lastChange.timestamp)
    );

    state.hasUnsavedChanges = state.pendingChanges.length > 0;
    updateStatus(state.hasUnsavedChanges ? 'unsaved' : 'saved');
    updateChangesList();

    toast('Rückgängig gemacht', 'success');
}

/**
 * Redo letzte rückgängig gemachte Änderung
 */
export function redo() {
    if (state.redoStack.length === 0) {
        toast('Nichts zum Wiederherstellen', 'info');
        return;
    }

    const change = state.redoStack.pop();
    state.undoStack = [...state.undoStack, change];

    // Änderung wiederherstellen (im Frame)
    const frame = document.getElementById('siteFrame');
    if (!frame?.contentDocument) return;

    const doc = frame.contentDocument;
    const el = doc.querySelector(`[data-edit-idx="${change.idx}"]`);

    if (el && change.type === 'text') {
        el.textContent = change.newVal;
        el.setAttribute('data-changed', 'true');
    }

    addPendingChange(change);
    updateStatus('unsaved');
    updateChangesList();

    toast('Wiederhergestellt', 'success');
}

/**
 * Gibt das aktive Element zurück
 * @returns {HTMLElement|null}
 */
export function getActiveElement() {
    return activeElement;
}
