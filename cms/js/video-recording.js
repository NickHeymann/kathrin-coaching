/**
 * Video Recording Module
 * Screen/Webcam Recording für Video-Feedback
 * @module video-recording
 */

import { state } from './state.js';
import { github } from './github-api.js';
import { CONFIG } from './config.js';
import { toast } from './ui.js';

// Recording State
let mediaRecorder = null;
let recordedChunks = [];
let recordedBlob = null;
let recordingStartTime = null;
let recordingTimer = null;
let screenStream = null;
let audioStream = null;
let camStream = null;
let previewStream = null;

// PiP State
let pipPosition = { x: 20, y: null };
let pipSize = 'medium';
let isDragging = false;
let isResizing = false;
let dragOffset = { x: 0, y: 0 };

// Settings State (ob Setup bereits gemacht wurde)
const SETTINGS_KEY = 'cms_recording_setup_done';

/**
 * Prüft ob das Setup bereits durchgeführt wurde
 */
function isSetupDone() {
    return localStorage.getItem(SETTINGS_KEY) === 'true';
}

/**
 * Markiert Setup als erledigt
 */
function markSetupDone() {
    localStorage.setItem(SETTINGS_KEY, 'true');
}

/**
 * Toggle Recording - zeigt Modal nur beim ersten Mal
 */
export function toggleRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        stopRecording();
    } else if (isSetupDone()) {
        // Direkt starten ohne Modal
        startRecording();
    } else {
        // Erstes Mal: Modal mit Webcam-Vorschau öffnen
        openRecordModal();
    }
}

/**
 * Öffnet das Recording-Modal mit Webcam-Vorschau
 */
async function openRecordModal() {
    document.getElementById('recordModal')?.classList.add('active');

    // Webcam-Vorschau starten
    await startWebcamPreview();
}

/**
 * Startet die Webcam-Vorschau im Modal
 */
async function startWebcamPreview() {
    const video = document.getElementById('webcamPreviewVideo');
    const placeholder = document.getElementById('webcamPreviewPlaceholder');

    if (!video) return;

    try {
        previewStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480 },
            audio: false
        });

        video.srcObject = previewStream;
        if (placeholder) placeholder.classList.add('hidden');

    } catch (e) {
        console.warn('Webcam-Vorschau nicht verfügbar:', e);
        if (placeholder) {
            placeholder.querySelector('p').textContent = 'Webcam nicht verfügbar';
        }
    }
}

/**
 * Stoppt die Webcam-Vorschau
 */
function stopWebcamPreview() {
    const video = document.getElementById('webcamPreviewVideo');
    const placeholder = document.getElementById('webcamPreviewPlaceholder');

    if (previewStream) {
        previewStream.getTracks().forEach(t => t.stop());
        previewStream = null;
    }

    if (video) video.srcObject = null;
    if (placeholder) placeholder.classList.remove('hidden');
}

/**
 * Schließt Record-Setup Modal
 */
export function closeRecordModal() {
    stopWebcamPreview();
    document.getElementById('recordModal')?.classList.remove('active');
}

/**
 * Zeigt Settings während der Aufnahme (öffnet Modal ohne Vorschau)
 */
export function showRecordSettings() {
    document.getElementById('recordModal')?.classList.add('active');
    // Keine Vorschau starten - Aufnahme läuft bereits
}

/**
 * Initialisiert Slider Event-Listener
 */
export function initRecordingControls() {
    // Brightness Slider
    const brightness = document.getElementById('camBrightness');
    const brightnessVal = document.getElementById('brightnessValue');
    if (brightness && brightnessVal) {
        brightness.addEventListener('input', () => {
            brightnessVal.textContent = brightness.value + '%';
            applyVideoFilters();
        });
    }

    // Contrast Slider
    const contrast = document.getElementById('camContrast');
    const contrastVal = document.getElementById('contrastValue');
    if (contrast && contrastVal) {
        contrast.addEventListener('input', () => {
            contrastVal.textContent = contrast.value + '%';
            applyVideoFilters();
        });
    }

    // PiP Drag & Resize
    setupPipInteraction();
}

/**
 * Wendet Helligkeit/Kontrast auf Webcam-Video an
 */
function applyVideoFilters() {
    const video = document.getElementById('webcamVideo');
    const brightness = document.getElementById('camBrightness')?.value || 100;
    const contrast = document.getElementById('camContrast')?.value || 100;

    if (video) {
        video.style.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
    }
}

/**
 * Setup PiP Dragging und Resizing
 */
function setupPipInteraction() {
    const pip = document.getElementById('webcamPip');
    const resizeHandle = pip?.querySelector('.pip-resize-handle');

    if (!pip) return;

    // Dragging
    pip.addEventListener('mousedown', (e) => {
        if (e.target.closest('.pip-controls') || e.target.closest('.pip-resize-handle')) return;
        isDragging = true;
        dragOffset.x = e.clientX - pip.offsetLeft;
        dragOffset.y = e.clientY - pip.offsetTop;
        pip.style.cursor = 'grabbing';
    });

    // Resizing
    if (resizeHandle) {
        resizeHandle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            isResizing = true;
        });
    }

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            pip.style.left = (e.clientX - dragOffset.x) + 'px';
            pip.style.top = (e.clientY - dragOffset.y) + 'px';
            pip.style.bottom = 'auto';
        }
        if (isResizing) {
            const rect = pip.getBoundingClientRect();
            const newWidth = e.clientX - rect.left;
            const newHeight = e.clientY - rect.top;
            pip.style.width = Math.max(100, Math.min(400, newWidth)) + 'px';
            pip.style.height = Math.max(75, Math.min(300, newHeight)) + 'px';
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        isResizing = false;
        if (pip) pip.style.cursor = 'grab';
    });
}

/**
 * Startet Bildschirm/Audio/Webcam Aufnahme
 */
export async function startRecording() {
    // Vorschau und Modal schließen
    stopWebcamPreview();
    closeRecordModal();

    // Setup als erledigt markieren
    markSetupDone();

    const useScreen = document.getElementById('recordScreen')?.checked ?? true;
    const useMic = document.getElementById('recordMic')?.checked ?? true;
    const useCam = document.getElementById('recordCam')?.checked ?? true;

    try {
        const tracks = [];

        // Bildschirm aufnehmen
        if (useScreen) {
            screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: { cursor: 'always' },
                audio: false
            });
            tracks.push(...screenStream.getVideoTracks());
        }

        // Mikrofon
        if (useMic) {
            audioStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false
            });
            tracks.push(...audioStream.getAudioTracks());
        }

        // Webcam mit PiP
        if (useCam) {
            const resolution = document.getElementById('camResolution')?.value || '640x480';
            const [width, height] = resolution.split('x').map(Number);

            camStream = await navigator.mediaDevices.getUserMedia({
                video: { width, height },
                audio: false
            });

            // PiP anzeigen
            showWebcamPip(camStream);
        }

        if (tracks.length === 0) {
            toast('Bitte mindestens Bildschirm oder Mikrofon auswählen', 'error');
            return;
        }

        const combinedStream = new MediaStream(tracks);

        // MediaRecorder starten
        mediaRecorder = new MediaRecorder(combinedStream, {
            mimeType: 'video/webm;codecs=vp9'
        });

        recordedChunks = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                recordedChunks.push(e.data);
            }
        };

        mediaRecorder.onstop = () => {
            recordedBlob = new Blob(recordedChunks, { type: 'video/webm' });
            showRecordingPreview();
        };

        // Bei Screen-Share-Stopp auch Recording stoppen
        if (screenStream) {
            screenStream.getVideoTracks()[0].onended = () => stopRecording();
        }

        mediaRecorder.start(1000);

        // UI aktualisieren
        const indicator = document.getElementById('recordingIndicator');
        if (indicator) indicator.style.display = 'flex';

        // Timer starten
        recordingStartTime = Date.now();
        recordingTimer = setInterval(updateRecordingTime, 1000);

        toast('Aufnahme gestartet - erkläre deine Änderungswünsche!', 'success');

    } catch (e) {
        console.error('Recording error:', e);
        toast('Aufnahme konnte nicht gestartet werden: ' + e.message, 'error');
        cleanupStreams();
    }
}

/**
 * Zeigt Webcam im PiP-Fenster
 */
function showWebcamPip(stream) {
    const pip = document.getElementById('webcamPip');
    const video = document.getElementById('webcamVideo');

    if (!pip || !video) return;

    video.srcObject = stream;

    // Größe basierend auf Auswahl
    const size = document.getElementById('pipSize')?.value || 'medium';
    const sizes = { small: 150, medium: 200, large: 280 };
    pip.style.width = sizes[size] + 'px';
    pip.style.height = (sizes[size] * 0.75) + 'px';

    // Position unten links
    pip.style.left = '20px';
    pip.style.bottom = '80px';
    pip.style.top = 'auto';

    // Filter anwenden
    applyVideoFilters();

    pip.classList.add('active');
}

/**
 * Schließt PiP-Fenster
 */
export function closePip() {
    const pip = document.getElementById('webcamPip');
    const video = document.getElementById('webcamVideo');

    if (pip) pip.classList.remove('active');
    if (video) video.srcObject = null;

    if (camStream) {
        camStream.getTracks().forEach(t => t.stop());
        camStream = null;
    }
}

/**
 * Wechselt PiP-Größe durch
 */
export function togglePipSize() {
    const pip = document.getElementById('webcamPip');
    if (!pip) return;

    const sizes = [150, 200, 280];
    const currentWidth = pip.offsetWidth;
    const currentIndex = sizes.findIndex(s => Math.abs(s - currentWidth) < 20);
    const nextIndex = (currentIndex + 1) % sizes.length;

    pip.style.width = sizes[nextIndex] + 'px';
    pip.style.height = (sizes[nextIndex] * 0.75) + 'px';
}

/**
 * Aktualisiert Timer-Anzeige
 */
function updateRecordingTime() {
    const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
    const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const secs = (elapsed % 60).toString().padStart(2, '0');
    const timeEl = document.getElementById('recordingTime');
    if (timeEl) timeEl.textContent = `${mins}:${secs}`;
}

/**
 * Stoppt laufende Aufnahme
 */
export function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }

    clearInterval(recordingTimer);

    const indicator = document.getElementById('recordingIndicator');
    if (indicator) indicator.style.display = 'none';

    // PiP schließen
    closePip();

    cleanupStreams();
}

/**
 * Räumt Media Streams auf
 */
function cleanupStreams() {
    [screenStream, audioStream].forEach(stream => {
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
        }
    });
    screenStream = null;
    audioStream = null;
    // camStream wird in closePip() aufgeräumt
}

/**
 * Zeigt Vorschau-Modal mit aufgenommenem Video
 */
function showRecordingPreview() {
    const video = document.getElementById('recordedVideo');
    if (video && recordedBlob) {
        video.src = URL.createObjectURL(recordedBlob);
    }
    document.getElementById('recordPreviewModal')?.classList.add('active');
}

/**
 * Verwirft aktuelle Aufnahme
 */
export function discardRecording() {
    document.getElementById('recordPreviewModal')?.classList.remove('active');
    const video = document.getElementById('recordedVideo');
    if (video) video.src = '';
    recordedBlob = null;
    recordedChunks = [];
    toast('Aufnahme verworfen', 'info');
}

/**
 * Speichert Aufnahme zu GitHub
 */
export async function saveRecording() {
    if (!recordedBlob) return;

    document.getElementById('recordPreviewModal')?.classList.remove('active');
    toast('Video wird zu GitHub hochgeladen...', 'info');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const pageName = state.currentPage ? state.currentPage.replace('.html', '') : 'allgemein';
    const filename = `video-feedback-${pageName}-${timestamp}.webm`;

    try {
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const content = reader.result.split(',')[1];

                await github.request(
                    `/repos/${CONFIG.owner}/${CONFIG.repo}/contents/feedback-videos/${filename}`,
                    {
                        method: 'PUT',
                        body: JSON.stringify({
                            message: `Video-Feedback: ${filename}`,
                            content: content,
                            branch: CONFIG.branch
                        })
                    }
                );

                toast('Video erfolgreich hochgeladen!', 'success');

            } catch (uploadError) {
                console.error('GitHub upload failed:', uploadError);
                // Fallback: als Download anbieten
                const link = document.createElement('a');
                link.download = filename;
                link.href = URL.createObjectURL(recordedBlob);
                link.click();
                toast('Video heruntergeladen (Upload fehlgeschlagen)', 'info');
            }

            recordedBlob = null;
            recordedChunks = [];
        };
        reader.readAsDataURL(recordedBlob);

    } catch (e) {
        console.error('Save recording error:', e);
        toast('Fehler beim Speichern: ' + e.message, 'error');
    }
}

/**
 * Schließt Preview Modal
 */
export function closePreviewModal() {
    document.getElementById('recordPreviewModal')?.classList.remove('active');
}
