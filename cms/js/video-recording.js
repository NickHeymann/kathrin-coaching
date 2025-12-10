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
let isRecording = false;

// Background Blur State
let blurCanvas = null;
let blurCtx = null;
let blurAnimationId = null;

// Audio Processing State
let audioContext = null;
let audioProcessingNodes = [];

// PiP State
let isDragging = false;
let isResizing = false;
let dragOffset = { x: 0, y: 0 };

// Settings State
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
 * Toggle Recording - zeigt immer Vorschau vor Aufnahme
 */
export function toggleRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        stopRecording();
    } else {
        // Immer Vorschau-Modal öffnen, damit Kunden sich sehen können
        openRecordModal();
    }
}

/**
 * Öffnet das Recording-Modal mit Webcam-Vorschau im PiP-Fenster
 */
async function openRecordModal() {
    document.getElementById('recordModal')?.classList.add('active');

    // Settings aktivieren (nicht während Aufnahme)
    setSettingsEnabled(true);

    // Webcam-Vorschau im echten PiP-Fenster starten (wenn Webcam aktiviert)
    const useCam = document.getElementById('recordCam')?.checked;
    if (useCam) {
        await startWebcamPreview();
    }
}

/**
 * Aktiviert/Deaktiviert Settings-Elemente
 */
function setSettingsEnabled(enabled) {
    const settingsElements = [
        'recordScreen', 'recordMic', 'recordCam',
        'camResolution', 'camBrightness', 'camContrast',
        'bgBlur', 'blurStrength'
    ];

    settingsElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.disabled = !enabled;
            if (!enabled) {
                el.closest('.record-option, .settings-row')?.classList.add('disabled');
            } else {
                el.closest('.record-option, .settings-row')?.classList.remove('disabled');
            }
        }
    });

    // Details-Element auch deaktivieren
    const details = document.getElementById('camSettingsDetails');
    if (details) {
        if (!enabled) {
            details.classList.add('disabled');
        } else {
            details.classList.remove('disabled');
        }
    }
}

/**
 * Startet die Webcam-Vorschau im PiP-Fenster (unten links)
 */
async function startWebcamPreview() {
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

        // Standard PiP-Größe (stufenloses Resizing per Drag)
        const defaultWidth = 200;
        pip.style.width = defaultWidth + 'px';
        pip.style.height = (defaultWidth * 0.75) + 'px';

        // Position unten links
        pip.style.left = '20px';
        pip.style.bottom = '80px';
        pip.style.top = 'auto';

        // Filter anwenden
        applyVideoFilters();

        // Background Blur starten wenn aktiviert
        const blurEnabled = document.getElementById('bgBlur')?.checked;
        if (blurEnabled) {
            startBackgroundBlur(video, pip);
        }

        // PiP anzeigen mit "Vorschau"-Indikator
        pip.classList.add('active', 'preview-mode');

    } catch (e) {
        console.warn('Webcam-Vorschau nicht verfügbar:', e);
        toast('Webcam nicht verfügbar', 'error');
    }
}

/**
 * Stoppt die Webcam-Vorschau
 */
function stopWebcamPreview() {
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
    // Nur wenn nicht während Aufnahme
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
 * Toggle Background Blur
 */
export function toggleBackgroundBlur(enabled) {
    if (isRecording) return;

    const video = document.getElementById('webcamVideo');
    const pip = document.getElementById('webcamPip');
    const strengthRow = document.getElementById('blurStrengthRow');

    // Blur-Stärke Zeile ein-/ausblenden
    if (strengthRow) {
        strengthRow.style.display = enabled ? 'flex' : 'none';
    }

    if (enabled && previewStream && video && pip) {
        startBackgroundBlur(video, pip);
    } else {
        stopBackgroundBlur();
    }
}

/**
 * Aktualisiert Blur-Stärke
 */
export function updateBlurStrength() {
    // Blur wird in der Animation-Loop automatisch aktualisiert
    const strength = document.getElementById('blurStrength')?.value || 10;
    const label = document.getElementById('blurStrengthValue');
    if (label) label.textContent = strength + 'px';
}

/**
 * Startet Background Blur mit CSS backdrop-filter
 * Hinweis: Echter Personen-Hintergrund-Blur benötigt ML-Bibliotheken
 */
function startBackgroundBlur(video, pip) {
    const strength = document.getElementById('blurStrength')?.value || 10;

    // CSS-basierter Blur auf Video
    // Echter Portrait-Mode benötigt TensorFlow.js/MediaPipe (zu groß für dieses Projekt)
    // Stattdessen nutzen wir einen einfachen Blur-Effekt
    video.style.filter = getVideoFilter() + ` blur(${strength}px)`;

    // Hinweis: Für echten Portrait-Mode müsste man:
    // 1. MediaPipe Selfie Segmentation laden
    // 2. Canvas mit Maske rendern
    // Das würde ~2MB zusätzliche Bibliotheken erfordern

    pip.classList.add('blur-active');
}

/**
 * Stoppt Background Blur
 */
function stopBackgroundBlur() {
    const video = document.getElementById('webcamVideo');
    const pip = document.getElementById('webcamPip');

    if (video) {
        video.style.filter = getVideoFilter();
    }
    if (pip) {
        pip.classList.remove('blur-active');
    }

    if (blurAnimationId) {
        cancelAnimationFrame(blurAnimationId);
        blurAnimationId = null;
    }
}

/**
 * Gibt aktuellen Video-Filter zurück (Helligkeit/Kontrast)
 */
function getVideoFilter() {
    const brightness = document.getElementById('camBrightness')?.value || 100;
    const contrast = document.getElementById('camContrast')?.value || 100;
    return `brightness(${brightness}%) contrast(${contrast}%)`;
}

/**
 * Schließt Record-Setup Modal
 */
export function closeRecordModal() {
    // Nur Vorschau stoppen wenn nicht während Aufnahme
    if (!isRecording) {
        stopWebcamPreview();
    }
    document.getElementById('recordModal')?.classList.remove('active');
}

/**
 * Zeigt Settings (nur lesend während Aufnahme)
 */
export function showRecordSettings() {
    document.getElementById('recordModal')?.classList.add('active');
    // Settings deaktivieren während Aufnahme
    setSettingsEnabled(!isRecording);
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

    // Blur Strength Slider
    const blurStrength = document.getElementById('blurStrength');
    const blurStrengthVal = document.getElementById('blurStrengthValue');
    if (blurStrength && blurStrengthVal) {
        blurStrength.addEventListener('input', () => {
            blurStrengthVal.textContent = blurStrength.value + 'px';
            // Blur aktualisieren wenn aktiv
            const blurEnabled = document.getElementById('bgBlur')?.checked;
            if (blurEnabled && previewStream) {
                const video = document.getElementById('webcamVideo');
                if (video) {
                    video.style.filter = getVideoFilter() + ` blur(${blurStrength.value}px)`;
                }
            }
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
    const blurEnabled = document.getElementById('bgBlur')?.checked;
    const blurStrength = document.getElementById('blurStrength')?.value || 10;

    if (video) {
        let filter = getVideoFilter();
        if (blurEnabled) {
            filter += ` blur(${blurStrength}px)`;
        }
        video.style.filter = filter;
    }
}

/**
 * Setup PiP Dragging und Resizing
 * Einfach, performant, ohne Lag
 */
function setupPipInteraction() {
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

        // Diagonal resize - nimm den größeren Wert
        const delta = Math.max(dx, dy);
        let newWidth = startWidth + delta;

        // Constraints
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

/**
 * Startet Bildschirm/Audio/Webcam Aufnahme
 */
export async function startRecording() {
    // Vorschau stoppen und Modal schließen
    stopWebcamPreview();
    closeRecordModal();

    // Setup als erledigt markieren
    markSetupDone();
    isRecording = true;

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

        // Mikrofon mit Audio-Optimierung
        if (useMic) {
            // Audio-Constraints für beste Qualität mit Browser-eigener Rauschunterdrückung
            audioStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,      // Echo-Unterdrückung
                    noiseSuppression: true,      // Rauschunterdrückung
                    autoGainControl: true,       // Automatische Verstärkung
                    sampleRate: 48000,           // Hohe Sample-Rate
                    channelCount: 1              // Mono für Sprache
                },
                video: false
            });

            // Zusätzliche Web Audio API Verarbeitung für Compression & Limiting
            const processedAudioTrack = await createAudioProcessingChain(audioStream);
            if (processedAudioTrack) {
                tracks.push(processedAudioTrack);
            } else {
                tracks.push(...audioStream.getAudioTracks());
            }
        }

        // Webcam mit PiP
        if (useCam) {
            const resolution = document.getElementById('camResolution')?.value || '640x480';
            const [width, height] = resolution.split('x').map(Number);

            camStream = await navigator.mediaDevices.getUserMedia({
                video: { width, height },
                audio: false
            });

            // PiP anzeigen (ohne Vorschau-Modus)
            showWebcamPip(camStream);
        }

        if (tracks.length === 0) {
            toast('Bitte mindestens Bildschirm oder Mikrofon auswählen', 'error');
            isRecording = false;
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
        isRecording = false;
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

    // Behalte aktuelle Größe bei (wurde ggf. in Vorschau angepasst)
    // Falls keine Größe gesetzt, Standard verwenden
    if (!pip.style.width || pip.style.width === '0px') {
        const defaultWidth = 200;
        pip.style.width = defaultWidth + 'px';
        pip.style.height = (defaultWidth * 0.75) + 'px';
    }

    // Position unten links
    pip.style.left = '20px';
    pip.style.bottom = '80px';
    pip.style.top = 'auto';

    // Filter anwenden
    applyVideoFilters();

    pip.classList.add('active');
    pip.classList.remove('preview-mode'); // Kein Vorschau-Badge während Aufnahme
}

/**
 * Schließt PiP-Fenster (intern)
 */
function closePip() {
    const pip = document.getElementById('webcamPip');
    const video = document.getElementById('webcamVideo');

    stopBackgroundBlur();

    if (pip) pip.classList.remove('active', 'preview-mode', 'blur-active');
    if (video) video.srcObject = null;

    if (camStream) {
        camStream.getTracks().forEach(t => t.stop());
        camStream = null;
    }
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
    isRecording = false;

    const indicator = document.getElementById('recordingIndicator');
    if (indicator) indicator.style.display = 'none';

    // PiP schließen
    closePip();

    cleanupStreams();
}

/**
 * Erstellt Audio-Processing-Kette mit Compression und Limiting
 * für Live-Verarbeitung während der Aufnahme
 */
async function createAudioProcessingChain(inputStream) {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioProcessingNodes = [];

        // Input von Mikrofon-Stream
        const source = audioContext.createMediaStreamSource(inputStream);
        audioProcessingNodes.push(source);

        // 1. High-Pass Filter (entfernt tiefes Rauschen/Brummen)
        const highPass = audioContext.createBiquadFilter();
        highPass.type = 'highpass';
        highPass.frequency.value = 80;
        highPass.Q.value = 0.7;
        audioProcessingNodes.push(highPass);

        // 2. Low-Pass Filter (entfernt hochfrequentes Rauschen)
        const lowPass = audioContext.createBiquadFilter();
        lowPass.type = 'lowpass';
        lowPass.frequency.value = 12000;
        lowPass.Q.value = 0.7;
        audioProcessingNodes.push(lowPass);

        // 3. Dynamics Compressor (gleichmäßige Lautstärke)
        const compressor = audioContext.createDynamicsCompressor();
        compressor.threshold.value = -24;  // Ab -24dB komprimieren
        compressor.knee.value = 12;        // Sanfter Übergang
        compressor.ratio.value = 4;        // 4:1 Kompression
        compressor.attack.value = 0.003;   // 3ms Attack
        compressor.release.value = 0.25;   // 250ms Release
        audioProcessingNodes.push(compressor);

        // 4. Makeup Gain (Ausgleich nach Kompression)
        const makeupGain = audioContext.createGain();
        makeupGain.gain.value = 1.3;       // Leichte Verstärkung
        audioProcessingNodes.push(makeupGain);

        // 5. Limiter (verhindert Clipping)
        const limiter = audioContext.createDynamicsCompressor();
        limiter.threshold.value = -1;      // Limitiert bei -1dB
        limiter.knee.value = 0;            // Harter Limiter
        limiter.ratio.value = 20;          // 20:1 = quasi Limiter
        limiter.attack.value = 0.001;      // 1ms Attack
        limiter.release.value = 0.1;       // 100ms Release
        audioProcessingNodes.push(limiter);

        // Output - MediaStreamDestination für Recording
        const destination = audioContext.createMediaStreamDestination();

        // Kette verbinden
        source.connect(highPass);
        highPass.connect(lowPass);
        lowPass.connect(compressor);
        compressor.connect(makeupGain);
        makeupGain.connect(limiter);
        limiter.connect(destination);

        console.log('Audio-Processing-Kette aktiv: HP Filter → LP Filter → Compressor → Gain → Limiter');

        // Den verarbeiteten Audio-Track zurückgeben
        return destination.stream.getAudioTracks()[0];

    } catch (error) {
        console.warn('Audio-Processing nicht verfügbar, verwende Original:', error);
        return null;
    }
}

/**
 * Räumt Audio-Processing auf
 */
function cleanupAudioProcessing() {
    if (audioContext && audioContext.state !== 'closed') {
        audioContext.close().catch(() => {});
    }
    audioContext = null;
    audioProcessingNodes = [];
}

/**
 * Räumt Media Streams auf
 */
function cleanupStreams() {
    // Audio-Processing aufräumen
    cleanupAudioProcessing();

    [screenStream, audioStream].forEach(stream => {
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
        }
    });
    screenStream = null;
    audioStream = null;
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
 * Audio wurde bereits während der Aufnahme optimiert (Noise Suppression, Compression, Limiting)
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
