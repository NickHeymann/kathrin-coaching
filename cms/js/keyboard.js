/**
 * Keyboard Shortcuts Module
 * Tastenkombinationen für den Editor
 * @module keyboard
 */

import { undo, redo } from './text-editor.js';
import { saveNow } from './autosave.js';
import { closeAllPopups } from './ui.js';

/**
 * Erkennt ob Mac-System verwendet wird
 * @returns {boolean}
 */
function isMac() {
    return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
}

/**
 * Richtet globale Keyboard-Shortcuts ein
 */
export function setupKeyboardShortcuts() {
    document.addEventListener('keydown', handleKeydown);
}

/**
 * Entfernt Keyboard-Shortcuts
 */
export function removeKeyboardShortcuts() {
    document.removeEventListener('keydown', handleKeydown);
}

/**
 * Keyboard-Event Handler
 * @param {KeyboardEvent} e - Event
 */
function handleKeydown(e) {
    const cmdOrCtrl = isMac() ? e.metaKey : e.ctrlKey;

    // Cmd/Ctrl+Z = Undo
    if (cmdOrCtrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
    }

    // Cmd/Ctrl+Shift+Z oder Cmd/Ctrl+Y = Redo
    if ((cmdOrCtrl && e.shiftKey && e.key === 'z') || (cmdOrCtrl && e.key === 'y')) {
        e.preventDefault();
        redo();
        return;
    }

    // Cmd/Ctrl+S = Speichern
    if (cmdOrCtrl && e.key === 's') {
        e.preventDefault();
        saveNow();
        return;
    }

    // Escape = Popups schließen
    if (e.key === 'Escape') {
        closeAllPopups();
        return;
    }
}

/**
 * Registriert zusätzlichen Keyboard-Handler
 * @param {string} key - Taste
 * @param {boolean} cmdOrCtrl - Erfordert Cmd/Ctrl
 * @param {boolean} shift - Erfordert Shift
 * @param {Function} callback - Auszuführende Funktion
 * @returns {Function} Remove-Funktion
 */
export function registerShortcut(key, cmdOrCtrl, shift, callback) {
    const handler = (e) => {
        const modifier = isMac() ? e.metaKey : e.ctrlKey;

        if (e.key.toLowerCase() === key.toLowerCase() &&
            modifier === cmdOrCtrl &&
            e.shiftKey === shift) {
            e.preventDefault();
            callback();
        }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
}

/**
 * Gibt Shortcut-Info zurück (für Hilfe/Tooltips)
 * @returns {Array} Liste von Shortcuts
 */
export function getShortcutInfo() {
    const cmdKey = isMac() ? '⌘' : 'Ctrl';

    return [
        { keys: `${cmdKey}+Z`, action: 'Rückgängig' },
        { keys: `${cmdKey}+Shift+Z`, action: 'Wiederherstellen' },
        { keys: `${cmdKey}+S`, action: 'Speichern' },
        { keys: 'Escape', action: 'Popup schließen' },
        { keys: 'Enter', action: 'Textbearbeitung beenden' }
    ];
}
