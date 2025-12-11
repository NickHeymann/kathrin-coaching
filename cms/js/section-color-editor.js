/**
 * Section Color Editor Module
 * Bearbeitung von Farben und Gradienten in Sektionen
 * @module section-color-editor
 */

import { state, addPendingChange } from './state.js';
import { toast, updateStatus, updateChangesList } from './ui.js';
import { saveToLocalBackup } from './storage.js';
import { addToUndoStack } from './text-editor.js';

let currentElement = null;
let originalColors = null;

/**
 * Parst einen Gradienten und extrahiert die Farben
 * @param {string} gradient - CSS Gradient String
 * @returns {Object} Parsed Gradient Info
 */
export function parseGradient(gradient) {
    if (!gradient || gradient === 'none') return null;

    const result = {
        type: null,
        angle: null,
        colors: [],
        original: gradient
    };

    // Linear Gradient
    const linearMatch = gradient.match(/linear-gradient\(([^,]+),\s*(.+)\)/);
    if (linearMatch) {
        result.type = 'linear';
        result.angle = linearMatch[1].trim();
        result.colors = parseColorStops(linearMatch[2]);
        return result;
    }

    // Radial Gradient
    const radialMatch = gradient.match(/radial-gradient\(([^,]+),\s*(.+)\)/);
    if (radialMatch) {
        result.type = 'radial';
        result.shape = radialMatch[1].trim();
        result.colors = parseColorStops(radialMatch[2]);
        return result;
    }

    return null;
}

/**
 * Parst Color Stops aus einem Gradienten
 * @param {string} colorString - String mit Farben
 * @returns {Array} Array von {color, position}
 */
function parseColorStops(colorString) {
    const stops = [];
    // Regex für Farben (hex, rgb, rgba, named colors)
    const colorRegex = /(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|[a-zA-Z]+)(\s+[\d.]+%)?/g;

    let match;
    while ((match = colorRegex.exec(colorString)) !== null) {
        stops.push({
            color: match[1],
            position: match[2] ? match[2].trim() : null
        });
    }

    return stops;
}

/**
 * Baut einen Gradienten aus geparsten Daten neu auf
 * @param {Object} gradientInfo - Parsed Gradient Info
 * @returns {string} CSS Gradient String
 */
export function buildGradient(gradientInfo) {
    if (!gradientInfo) return 'none';

    const colorStops = gradientInfo.colors.map(stop =>
        stop.position ? `${stop.color} ${stop.position}` : stop.color
    ).join(', ');

    if (gradientInfo.type === 'linear') {
        return `linear-gradient(${gradientInfo.angle}, ${colorStops})`;
    } else if (gradientInfo.type === 'radial') {
        return `radial-gradient(${gradientInfo.shape}, ${colorStops})`;
    }

    return 'none';
}

/**
 * Öffnet Section-Color Edit Modal
 * @param {HTMLElement} el - Element mit Farbe/Gradient
 */
export function editSectionColor(el) {
    currentElement = el;

    const computedStyle = window.getComputedStyle(el);
    originalColors = {
        backgroundColor: computedStyle.backgroundColor,
        backgroundImage: computedStyle.backgroundImage,
        color: computedStyle.color
    };

    const modal = document.getElementById('colorModal');
    const bgColorInput = document.getElementById('sectionBgColor');
    const textColorInput = document.getElementById('sectionTextColor');
    const gradientPreview = document.getElementById('gradientPreview');
    const gradientEditor = document.getElementById('gradientEditor');

    // Prüfe ob Gradient vorhanden
    const gradient = parseGradient(originalColors.backgroundImage);

    if (gradient) {
        // Zeige Gradient Editor
        if (gradientEditor) gradientEditor.style.display = 'block';
        if (gradientPreview) {
            gradientPreview.style.background = originalColors.backgroundImage;
        }
        renderGradientColorPickers(gradient);
    } else {
        // Zeige einfachen Color Picker
        if (gradientEditor) gradientEditor.style.display = 'none';
        if (bgColorInput) {
            bgColorInput.value = rgbToHex(originalColors.backgroundColor) || '#ffffff';
        }
    }

    // Text Color
    if (textColorInput) {
        textColorInput.value = rgbToHex(originalColors.color) || '#000000';
    }

    if (modal) modal.classList.add('active');
}

/**
 * Rendert Color Picker für jeden Gradient-Stop
 * @param {Object} gradient - Parsed Gradient
 */
function renderGradientColorPickers(gradient) {
    const container = document.getElementById('gradientColorPickers');
    if (!container) return;

    container.innerHTML = '';
    container.dataset.gradientType = gradient.type;
    container.dataset.gradientAngle = gradient.angle || gradient.shape;

    gradient.colors.forEach((stop, index) => {
        const picker = document.createElement('div');
        picker.className = 'gradient-color-picker';
        picker.innerHTML = `
            <label>Farbe ${index + 1}${stop.position ? ` (${stop.position})` : ''}</label>
            <input type="color" value="${rgbToHex(stop.color) || '#ffffff'}"
                   data-index="${index}"
                   data-position="${stop.position || ''}"
                   onchange="CMS.updateGradientColor(${index}, this.value)">
        `;
        container.appendChild(picker);
    });
}

/**
 * Aktualisiert eine Gradient-Farbe
 * @param {number} index - Index der Farbe
 * @param {string} newColor - Neue Farbe (hex)
 */
export function updateGradientColor(index, newColor) {
    const container = document.getElementById('gradientColorPickers');
    const preview = document.getElementById('gradientPreview');
    if (!container) return;

    const inputs = container.querySelectorAll('input[type="color"]');
    const colors = Array.from(inputs).map(input => ({
        color: input.value,
        position: input.dataset.position || null
    }));

    const gradientInfo = {
        type: container.dataset.gradientType,
        angle: container.dataset.gradientAngle,
        shape: container.dataset.gradientAngle, // Für radial
        colors
    };

    const newGradient = buildGradient(gradientInfo);

    if (preview) {
        preview.style.background = newGradient;
    }

    // Live-Preview auf Element
    if (currentElement) {
        currentElement.style.backgroundImage = newGradient;
    }
}

/**
 * Schließt Color-Edit Modal
 */
export function closeColorModal() {
    const modal = document.getElementById('colorModal');
    if (modal) modal.classList.remove('active');

    // Restore original wenn nicht bestätigt
    if (currentElement && originalColors) {
        currentElement.style.backgroundColor = originalColors.backgroundColor;
        currentElement.style.backgroundImage = originalColors.backgroundImage;
        currentElement.style.color = originalColors.color;
    }

    currentElement = null;
    originalColors = null;
}

/**
 * Bestätigt Farb-Änderung
 */
export function confirmSectionColor() {
    if (!currentElement) return;

    const bgColorInput = document.getElementById('sectionBgColor');
    const textColorInput = document.getElementById('sectionTextColor');
    const gradientPreview = document.getElementById('gradientPreview');
    const gradientEditor = document.getElementById('gradientEditor');

    let newColors = {};

    // Prüfe ob Gradient bearbeitet wurde
    if (gradientEditor && gradientEditor.style.display !== 'none') {
        newColors.backgroundImage = gradientPreview?.style.background || originalColors.backgroundImage;
    } else if (bgColorInput) {
        newColors.backgroundColor = bgColorInput.value;
        currentElement.style.backgroundColor = bgColorInput.value;
    }

    if (textColorInput) {
        newColors.color = textColorInput.value;
        currentElement.style.color = textColorInput.value;
    }

    currentElement.setAttribute('data-color-changed', 'true');

    const change = {
        type: 'section-color',
        idx: currentElement.dataset.colorEditIdx,
        selector: getElementSelector(currentElement),
        orig: originalColors,
        newVal: newColors,
        page: state.currentPage,
        timestamp: Date.now()
    };

    addPendingChange(change);
    updateStatus('unsaved');
    updateChangesList();
    addToUndoStack(change);
    saveToLocalBackup();

    // Modal schließen ohne Reset
    const modal = document.getElementById('colorModal');
    if (modal) modal.classList.remove('active');

    currentElement = null;
    originalColors = null;

    toast('Farben geändert', 'success');
}

/**
 * Konvertiert RGB zu Hex
 * @param {string} rgb - RGB String
 * @returns {string} Hex String
 */
function rgbToHex(rgb) {
    if (!rgb || rgb === 'transparent') return null;
    if (rgb.startsWith('#')) return rgb;

    const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return null;

    const r = parseInt(match[1]).toString(16).padStart(2, '0');
    const g = parseInt(match[2]).toString(16).padStart(2, '0');
    const b = parseInt(match[3]).toString(16).padStart(2, '0');

    return `#${r}${g}${b}`;
}

/**
 * Generiert einen CSS-Selektor für ein Element
 * @param {HTMLElement} el - Element
 * @returns {string} CSS-Selektor
 */
function getElementSelector(el) {
    if (el.id) return `#${el.id}`;
    if (el.className) {
        const classes = el.className.split(' ').filter(c => c.trim()).slice(0, 2).join('.');
        return `${el.tagName.toLowerCase()}.${classes}`;
    }
    return el.tagName.toLowerCase();
}

/**
 * Prüft ob ein Element farbbearbeitbar ist
 * @param {HTMLElement} el - Element
 * @returns {boolean}
 */
export function isColorEditable(el) {
    const style = window.getComputedStyle(el);
    const hasBackground = style.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
                         style.backgroundColor !== 'transparent';
    const hasGradient = style.backgroundImage && style.backgroundImage !== 'none' &&
                       style.backgroundImage.includes('gradient');

    return hasBackground || hasGradient;
}

/**
 * Richtet Section-Color Editing für ein Element ein
 * @param {HTMLElement} el - Section/Container Element
 * @param {number} index - Index für Tracking
 */
export function setupSectionColorEditing(el, index) {
    el.dataset.colorEditIdx = `color-${index}`;

    // Doppelklick für Farbbearbeitung
    el.addEventListener('dblclick', (e) => {
        // Nur wenn nicht auf Text/Bild geklickt
        const target = e.target;
        if (target.tagName === 'IMG' || target.contentEditable === 'true') return;
        if (target.dataset.editIdx) return; // Ist ein Text-Element

        e.preventDefault();
        e.stopPropagation();
        editSectionColor(el);
    });
}

/**
 * Gibt aktuelles Element zurück
 * @returns {HTMLElement|null}
 */
export function getCurrentColorElement() {
    return currentElement;
}
