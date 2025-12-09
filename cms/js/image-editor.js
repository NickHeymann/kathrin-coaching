/**
 * Image Editor Module
 * Bild-Upload und -Bearbeitung
 * @module image-editor
 */

import { state, addPendingChange } from './state.js';
import { toast, updateStatus, updateChangesList } from './ui.js';
import { saveToLocalBackup } from './storage.js';
import { addToUndoStack, addToElementHistory } from './text-editor.js';

let currentImg = null;
let newImgData = null;

/**
 * Öffnet Bild-Edit Modal
 * @param {HTMLImageElement} img - Zu bearbeitendes Bild
 */
export function editImage(img) {
    currentImg = img;
    newImgData = null;

    const modal = document.getElementById('imgModal');
    const preview = document.getElementById('imgPreview');
    const confirmBtn = document.getElementById('imgConfirmBtn');

    if (modal) modal.classList.add('active');
    if (preview) preview.style.display = 'none';
    if (confirmBtn) confirmBtn.disabled = true;
}

/**
 * Schließt Bild-Edit Modal
 */
export function closeImageModal() {
    const modal = document.getElementById('imgModal');
    const input = document.getElementById('imgInput');

    if (modal) modal.classList.remove('active');
    if (input) input.value = '';

    currentImg = null;
    newImgData = null;
}

/**
 * Verarbeitet hochgeladene Bild-Datei
 * @param {File} file - Bilddatei
 */
export function handleImageFile(file) {
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        toast('Nur JPG, PNG, GIF oder WebP erlaubt', 'error');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        toast('Maximale Dateigröße: 5 MB', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        newImgData = {
            data: e.target.result,
            name: generateImageName(file.name),
            type: file.type
        };

        const preview = document.getElementById('imgPreview');
        const confirmBtn = document.getElementById('imgConfirmBtn');

        if (preview) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        }
        if (confirmBtn) {
            confirmBtn.disabled = false;
        }
    };

    reader.readAsDataURL(file);
}

/**
 * Generiert eindeutigen Dateinamen
 * @param {string} originalName - Original-Dateiname
 * @returns {string} Neuer eindeutiger Name
 */
function generateImageName(originalName) {
    const ext = originalName.split('.').pop();
    const timestamp = Date.now();
    const sanitized = originalName
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-z0-9]/gi, '-')
        .toLowerCase()
        .substring(0, 30);

    return `${sanitized}-${timestamp}.${ext}`;
}

/**
 * Bestätigt Bildänderung
 */
export function confirmImage() {
    if (!currentImg || !newImgData) return;

    currentImg.src = newImgData.data;
    currentImg.setAttribute('data-changed', 'true');

    const change = {
        type: 'image',
        idx: currentImg.dataset.editIdx,
        orig: currentImg.dataset.editOrig,
        newFile: newImgData.name,
        newData: newImgData.data,
        page: state.currentPage,
        timestamp: Date.now()
    };

    addPendingChange(change);
    state.images = [...state.images, newImgData];

    updateStatus('unsaved');
    updateChangesList();

    addToUndoStack(change);
    addToElementHistory(currentImg.dataset.editIdx, change);
    saveToLocalBackup();

    closeImageModal();
    toast('Bild ersetzt', 'success');
}

/**
 * Richtet Bild-Resize für ein Bild ein
 * @param {HTMLImageElement} img - Bild-Element
 * @param {Document} doc - Document des iframes
 */
export function setupImageResize(img, doc) {
    img.addEventListener('mousedown', (e) => {
        if (e.target !== img) return;

        // Nur wenn nahe der unteren rechten Ecke geklickt
        const rect = img.getBoundingClientRect();
        const cornerSize = 20;

        const isNearCorner =
            e.clientX > rect.right - cornerSize &&
            e.clientY > rect.bottom - cornerSize;

        if (!isNearCorner) return;

        e.preventDefault();

        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = img.offsetWidth;
        const startHeight = img.offsetHeight;
        const aspectRatio = startWidth / startHeight;

        const onMouseMove = (moveEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const newWidth = Math.max(50, startWidth + deltaX);
            const newHeight = newWidth / aspectRatio;

            img.style.width = `${newWidth}px`;
            img.style.height = `${newHeight}px`;
        };

        const onMouseUp = () => {
            doc.removeEventListener('mousemove', onMouseMove);
            doc.removeEventListener('mouseup', onMouseUp);

            // Änderung registrieren
            if (img.style.width !== `${startWidth}px`) {
                const change = {
                    type: 'image-resize',
                    idx: img.dataset.editIdx,
                    orig: { width: startWidth, height: startHeight },
                    newVal: {
                        width: img.offsetWidth,
                        height: img.offsetHeight
                    },
                    page: state.currentPage,
                    timestamp: Date.now()
                };

                addPendingChange(change);
                updateStatus('unsaved');
                updateChangesList();
                toast('Bildgröße geändert', 'success');
            }
        };

        doc.addEventListener('mousemove', onMouseMove);
        doc.addEventListener('mouseup', onMouseUp);
    });
}

/**
 * Gibt aktuelles Bild zurück
 * @returns {HTMLImageElement|null}
 */
export function getCurrentImage() {
    return currentImg;
}
