/**
 * Video Recording PiP Module
 * Picture-in-Picture, Drag & Drop, Resize
 * @module recording/pip
 */

import { toast } from '../ui.js';
import { applyVideoFilters, startBackgroundBlur, stopBackgroundBlur } from './effects.js';
import { isRecording } from './core.js';

// PiP State
let isDragging = false;
let isResizing = false;
let previewStream = null;

/**
 * Startet die Webcam-Vorschau im PiP-Fenster (unten links)
 */
export async function startWebcamPreview() {
    const pip = document.getElementById('webcamPip');
    const video = document.getElementById('webcamVideo');

    if (!pip || !video) return;

    try {
        const resolution = document.getElementById('camResolution')?.value || '640x480';
        const [width, height] = resolution.split('x').map(Number);

        previewStream = await navigator.mediaDevices.getUserMedia({
            video: { width, height },
            audio: false
        });

        video.srcObject = previewStream;

        const defaultWidth = 200;
        pip.style.width = defaultWidth + 'px';
        pip.style.height = (defaultWidth * 0.75) + 'px';

        pip.style.left = '20px';
        pip.style.bottom = '80px';
        pip.style.top = 'auto';

        applyVideoFilters();

        const blurEnabled = document.getElementById('bgBlur')?.checked;
        if (blurEnabled) {
            startBackgroundBlur(video, pip);
        }

        pip.classList.add('active', 'preview-mode');

    } catch (e) {
        toast('Webcam nicht verfügbar', 'error');
    }
}

/**
 * Stoppt die Webcam-Vorschau
 */
export function stopWebcamPreview() {
    const pip = document.getElementById('webcamPip');
    const video = document.getElementById('webcamVideo');

    stopBackgroundBlur();

    if (previewStream) {
        previewStream.getTracks().forEach(t => t.stop());
        previewStream = null;
    }

    if (video) video.srcObject = null;
    if (pip) {
        pip.classList.remove('active', 'preview-mode');
    }
}

/**
 * Toggle Webcam-Vorschau (für Checkbox)
 */
export function toggleWebcamPreview(show) {
    if (isRecording) return;

    if (show) {
        startWebcamPreview();
    } else {
        stopWebcamPreview();
    }
}

/**
 * Aktualisiert Vorschau-Auflösung
 */
export async function updatePreviewResolution() {
    if (isRecording) return;

    if (previewStream) {
        stopWebcamPreview();
        await startWebcamPreview();
    }
}

/**
 * Zeigt Webcam im PiP-Fenster (während Aufnahme)
 */
export function showWebcamPip(stream) {
    const pip = document.getElementById('webcamPip');
    const video = document.getElementById('webcamVideo');

    if (!pip || !video) return;

    video.srcObject = stream;

    if (!pip.style.width || pip.style.width === '0px') {
        const defaultWidth = 200;
        pip.style.width = defaultWidth + 'px';
        pip.style.height = (defaultWidth * 0.75) + 'px';
    }

    pip.style.left = '20px';
    pip.style.bottom = '80px';
    pip.style.top = 'auto';

    applyVideoFilters();

    pip.classList.add('active');
    pip.classList.remove('preview-mode');
}

/**
 * Schließt PiP-Fenster (intern)
 */
export function closePip() {
    const pip = document.getElementById('webcamPip');
    const video = document.getElementById('webcamVideo');

    stopBackgroundBlur();

    if (pip) pip.classList.remove('active', 'preview-mode', 'blur-active');
    if (video) video.srcObject = null;
}

/**
 * Setup PiP Dragging und Resizing
 */
export function setupPipInteraction() {
    const pip = document.getElementById('webcamPip');
    if (!pip) return;

    const ASPECT_RATIO = 4 / 3;
    const MIN_SIZE = 80;
    const MAX_SIZE = 480;

    let startX, startY, startWidth, startHeight, startLeft, startTop;

    // === DRAG ===
    pip.addEventListener('pointerdown', (e) => {
        if (e.target.classList.contains('pip-resize-handle')) return;

        e.preventDefault();
        pip.setPointerCapture(e.pointerId);

        startX = e.clientX;
        startY = e.clientY;
        startLeft = pip.offsetLeft;
        startTop = pip.offsetTop;

        isDragging = true;
        pip.style.cursor = 'grabbing';
        pip.style.transition = 'none';
    });

    pip.addEventListener('pointermove', (e) => {
        if (!isDragging) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        pip.style.left = (startLeft + dx) + 'px';
        pip.style.top = (startTop + dy) + 'px';
        pip.style.bottom = 'auto';
    });

    pip.addEventListener('pointerup', (e) => {
        if (isDragging) {
            isDragging = false;
            pip.releasePointerCapture(e.pointerId);
            pip.style.cursor = 'grab';
            pip.style.transition = '';
        }
    });

    // === RESIZE ===
    const handle = pip.querySelector('.pip-resize-handle');
    if (!handle) return;

    handle.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handle.setPointerCapture(e.pointerId);

        startX = e.clientX;
        startY = e.clientY;
        startWidth = pip.offsetWidth;
        startHeight = pip.offsetHeight;

        isResizing = true;
        pip.style.transition = 'none';
    });

    handle.addEventListener('pointermove', (e) => {
        if (!isResizing) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        const delta = Math.max(dx, dy);
        let newWidth = startWidth + delta;

        newWidth = Math.max(MIN_SIZE, Math.min(MAX_SIZE, newWidth));
        const newHeight = newWidth / ASPECT_RATIO;

        pip.style.width = newWidth + 'px';
        pip.style.height = newHeight + 'px';
    });

    handle.addEventListener('pointerup', (e) => {
        if (isResizing) {
            isResizing = false;
            handle.releasePointerCapture(e.pointerId);
            pip.style.transition = '';
        }
    });
}
