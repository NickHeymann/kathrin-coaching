/**
 * Background Image Editor Module
 * Bearbeitung von CSS Background-Images (Hero-Sektionen, etc.)
 * @module background-editor
 */

import { state, addPendingChange } from './state.js';
import { toast, updateStatus, updateChangesList } from './ui.js';
import { saveToLocalBackup } from './storage.js';
import { addToUndoStack } from './text-editor.js';

let currentElement = null;
let newBgData = null;
let originalBgStyle = null;

/**
 * Prüft ob ein Element ein Background-Image hat
 * @param {HTMLElement} el - Element zum Prüfen
 * @returns {boolean}
 */
export function hasBackgroundImage(el) {
    const style = window.getComputedStyle(el);
    const bgImage = style.backgroundImage;
    return bgImage && bgImage !== 'none' && bgImage.includes('url(');
}

/**
 * Extrahiert die Background-Image URL aus einem Element
 * @param {HTMLElement} el - Element
 * @returns {string|null} URL oder null
 */
export function extractBackgroundUrl(el) {
    const style = window.getComputedStyle(el);
    const bgImage = style.backgroundImage;

    if (!bgImage || bgImage === 'none') return null;

    // Extrahiere URL aus url("...")
    const match = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
    return match ? match[1] : null;
}

/**
 * Öffnet Background-Image Edit Modal
 * @param {HTMLElement} el - Element mit Background-Image
 */
export function editBackground(el) {
    currentElement = el;
    newBgData = null;

    const computedStyle = window.getComputedStyle(el);
    originalBgStyle = {
        backgroundImage: computedStyle.backgroundImage,
        backgroundSize: computedStyle.backgroundSize,
        backgroundPosition: computedStyle.backgroundPosition,
        backgroundRepeat: computedStyle.backgroundRepeat
    };

    const modal = document.getElementById('bgModal');
    const preview = document.getElementById('bgPreview');
    const confirmBtn = document.getElementById('bgConfirmBtn');
    const currentBgDisplay = document.getElementById('currentBgDisplay');

    // Zeige aktuelles Hintergrundbild
    const currentUrl = extractBackgroundUrl(el);
    if (currentBgDisplay && currentUrl) {
        currentBgDisplay.innerHTML = `
            <div class="current-bg-preview" style="background-image: url('${currentUrl}'); background-size: cover; background-position: center;"></div>
            <small>Aktuelles Hintergrundbild</small>
        `;
    }

    if (modal) modal.classList.add('active');
    if (preview) preview.style.display = 'none';
    if (confirmBtn) confirmBtn.disabled = true;
}

/**
 * Schließt Background-Edit Modal
 */
export function closeBackgroundModal() {
    const modal = document.getElementById('bgModal');
    const input = document.getElementById('bgInput');

    if (modal) modal.classList.remove('active');
    if (input) input.value = '';

    currentElement = null;
    newBgData = null;
    originalBgStyle = null;
}

/**
 * Verarbeitet hochgeladene Hintergrundbild-Datei
 * @param {File} file - Bilddatei
 */
export function handleBackgroundFile(file) {
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        toast('Nur JPG, PNG oder WebP erlaubt', 'error');
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        toast('Maximale Dateigröße: 10 MB', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        newBgData = {
            data: e.target.result,
            name: generateBgImageName(file.name),
            type: file.type
        };

        const preview = document.getElementById('bgPreview');
        const confirmBtn = document.getElementById('bgConfirmBtn');

        if (preview) {
            preview.style.backgroundImage = `url('${e.target.result}')`;
            preview.style.backgroundSize = 'cover';
            preview.style.backgroundPosition = 'center';
            preview.style.display = 'block';
        }
        if (confirmBtn) {
            confirmBtn.disabled = false;
        }
    };

    reader.readAsDataURL(file);
}

/**
 * Generiert eindeutigen Dateinamen für Hintergrundbilder
 * @param {string} originalName - Original-Dateiname
 * @returns {string} Neuer eindeutiger Name
 */
function generateBgImageName(originalName) {
    const ext = originalName.split('.').pop();
    const timestamp = Date.now();
    const sanitized = originalName
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-z0-9]/gi, '-')
        .toLowerCase()
        .substring(0, 30);

    return `bg-${sanitized}-${timestamp}.${ext}`;
}

/**
 * Bestätigt Hintergrundbild-Änderung
 */
export function confirmBackground() {
    if (!currentElement || !newBgData) return;

    // Wende neues Hintergrundbild an
    currentElement.style.backgroundImage = `url('${newBgData.data}')`;
    currentElement.setAttribute('data-bg-changed', 'true');

    const change = {
        type: 'background-image',
        idx: currentElement.dataset.bgEditIdx,
        selector: getElementSelector(currentElement),
        orig: originalBgStyle,
        newFile: newBgData.name,
        newData: newBgData.data,
        page: state.currentPage,
        timestamp: Date.now()
    };

    addPendingChange(change);
    state.images = [...state.images, newBgData];

    updateStatus('unsaved');
    updateChangesList();
    addToUndoStack(change);
    saveToLocalBackup();

    closeBackgroundModal();
    toast('Hintergrundbild ersetzt', 'success');
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
 * Richtet Background-Image Editing für ein Element ein
 * @param {HTMLElement} el - Element mit Background-Image
 * @param {number} index - Index für Tracking
 */
export function setupBackgroundEditing(el, index) {
    el.dataset.bgEditIdx = `bg-${index}`;
    el.dataset.bgEditOrig = extractBackgroundUrl(el) || '';

    // Visueller Indikator
    el.style.cursor = 'pointer';
    el.style.position = 'relative';

    // Hover-Overlay für Background-Elemente
    el.addEventListener('mouseenter', () => {
        if (!el.querySelector('.bg-edit-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'bg-edit-overlay';
            overlay.innerHTML = '🖼️ Hintergrundbild ändern';
            el.appendChild(overlay);
        }
    });

    el.addEventListener('mouseleave', () => {
        const overlay = el.querySelector('.bg-edit-overlay');
        if (overlay) overlay.remove();
    });

    el.addEventListener('click', (e) => {
        // Nur wenn direkt auf das Element geklickt wurde (nicht auf Kinder)
        if (e.target === el || e.target.classList.contains('bg-edit-overlay')) {
            e.preventDefault();
            e.stopPropagation();
            editBackground(el);
        }
    });
}

/**
 * Gibt aktuelles Element zurück
 * @returns {HTMLElement|null}
 */
export function getCurrentBackgroundElement() {
    return currentElement;
}
