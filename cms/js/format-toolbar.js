/**
 * Format Toolbar Module
 * Text-Formatierung (Bold, Italic, etc.)
 * @module format-toolbar
 */

import { EMOJIS } from './config.js';

let currentSelection = null;

/**
 * Zeigt Formatierungs-Toolbar
 * @param {number} x - X-Position
 * @param {number} y - Y-Position
 */
export function showFormatToolbar(x, y) {
    const toolbar = document.getElementById('formatToolbar');
    if (!toolbar) return;

    // Speichere aktuelle Selection
    const frame = document.getElementById('siteFrame');
    if (frame?.contentDocument) {
        currentSelection = frame.contentDocument.getSelection();
    }

    toolbar.style.left = x + 'px';
    toolbar.style.top = Math.max(50, y) + 'px';
    toolbar.classList.add('active');
}

/**
 * Versteckt Formatierungs-Toolbar
 */
export function hideFormatToolbar() {
    const toolbar = document.getElementById('formatToolbar');
    if (toolbar) {
        toolbar.classList.remove('active');
    }
    currentSelection = null;
}

/**
 * Formatiert ausgewählten Text
 * @param {string} command - execCommand Befehl
 */
export function formatText(command) {
    const frame = document.getElementById('siteFrame');
    if (!frame?.contentDocument) return;

    frame.contentDocument.execCommand(command, false, null);
    hideFormatToolbar();
}

/**
 * Zeigt Farb-Picker
 * @param {number} x - X-Position
 * @param {number} y - Y-Position
 */
export function showColorPicker(x, y) {
    const picker = document.getElementById('colorPicker');
    if (!picker) return;

    // Position neben der Toolbar
    picker.style.left = x + 'px';
    picker.style.top = (y + 40) + 'px';
    picker.classList.add('active');
}

/**
 * Versteckt Farb-Picker
 */
export function hideColorPicker() {
    const picker = document.getElementById('colorPicker');
    if (picker) {
        picker.classList.remove('active');
    }
}

/**
 * Setzt Textfarbe
 * @param {string} color - CSS Farbwert
 */
export function setTextColor(color) {
    const frame = document.getElementById('siteFrame');
    if (!frame?.contentDocument) return;

    frame.contentDocument.execCommand('foreColor', false, color);
    hideColorPicker();
    hideFormatToolbar();
}

/**
 * Zeigt Emoji-Picker
 * @param {number} x - X-Position
 * @param {number} y - Y-Position
 */
export function showEmojiPicker(x, y) {
    const picker = document.getElementById('emojiPicker');
    if (!picker) return;

    picker.style.left = x + 'px';
    picker.style.top = (y + 40) + 'px';
    picker.classList.add('active');
}

/**
 * Versteckt Emoji-Picker
 */
export function hideEmojiPicker() {
    const picker = document.getElementById('emojiPicker');
    if (picker) {
        picker.classList.remove('active');
    }
}

/**
 * Fügt Emoji ein
 * @param {string} emoji - Emoji-Zeichen
 */
export function insertEmoji(emoji) {
    const frame = document.getElementById('siteFrame');
    if (!frame?.contentDocument) return;

    frame.contentDocument.execCommand('insertText', false, emoji);
    hideEmojiPicker();
    hideFormatToolbar();
}

/**
 * Initialisiert Emoji-Picker mit Buttons
 */
export function initEmojiPicker() {
    const picker = document.getElementById('emojiPicker');
    if (!picker) return;

    picker.innerHTML = EMOJIS.map(emoji =>
        `<button class="emoji-btn" onclick="window.CMS.insertEmoji('${emoji}')">${emoji}</button>`
    ).join('');
}

/**
 * Initialisiert Farb-Picker
 */
export function initColorPicker() {
    const picker = document.getElementById('colorPicker');
    if (!picker) return;

    const colors = [
        '#000000', '#333333', '#666666', '#999999', '#cccccc',
        '#ffffff', '#ff0000', '#ff6600', '#ffcc00', '#33cc33',
        '#0099ff', '#6633ff', '#cc33cc', '#ff3366', '#2C4A47',
        '#D4A574'
    ];

    picker.innerHTML = colors.map(color =>
        `<div class="color-swatch" style="background:${color}" onclick="window.CMS.setTextColor('${color}')"></div>`
    ).join('');
}
