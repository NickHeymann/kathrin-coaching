/**
 * Video Recording Core Module
 * Haupt-Recording-Logik, State-Management, Modal-Control
 * @module recording/core
 */

import { state } from '../state.js';
import { github } from '../github-api.js';
import { CONFIG } from '../config.js';
import { toast } from '../ui.js';
import { startWebcamPreview, stopWebcamPreview, showWebcamPip, closePip } from './pip.js';
import { createAudioProcessingChain, cleanupAudioProcessing, applyVideoFilters } from './effects.js';

// Recording State
let mediaRecorder = null;
let recordedChunks = [];
let recordedBlob = null;
let recordingStartTime = null;
let recordingTimer = null;
let screenStream = null;
let audioStream = null;
let camStream = null;
export let isRecording = false;

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
        openRecordModal();
    }
}

/**
 * Öffnet das Recording-Modal mit Webcam-Vorschau im PiP-Fenster
 */
async function openRecordModal() {
    document.getElementById('recordModal')?.classList.add('active');
    setSettingsEnabled(true);

    const useCam = document.getElementById('recordCam')?.checked;
    if (useCam) {
        await startWebcamPreview();
    }
}

/**
 * Aktiviert/Deaktiviert Settings-Elemente
 */
export function setSettingsEnabled(enabled) {
    const settingsElements = [
        'recordScreen', 'recordMic', 'recordCam',
        'camResolution', 'camBrightness', 'camContrast',
        'bgBlur', 'blurStrength'
    ];

    settingsElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.disabled = !enabled;
            const parent = el.closest('.record-option, .settings-row');
            if (parent) {
                enabled ? parent.classList.remove('disabled') : parent.classList.add('disabled');
            }
        }
    });

    const details = document.getElementById('camSettingsDetails');
    if (details) {
        enabled ? details.classList.remove('disabled') : details.classList.add('disabled');
    }
}

/**
 * Schließt Record-Setup Modal
 */
export function closeRecordModal() {
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
    setSettingsEnabled(!isRecording);
}

/**
 * Startet Bildschirm/Audio/Webcam Aufnahme
 */
export async function startRecording() {
    stopWebcamPreview();
    closeRecordModal();
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
            audioStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 48000,
                    channelCount: 1
                },
                video: false
            });

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

            showWebcamPip(camStream);
        }

        if (tracks.length === 0) {
            toast('Bitte mindestens Bildschirm oder Mikrofon auswählen', 'error');
            isRecording = false;
            return;
        }

        const combinedStream = new MediaStream(tracks);

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

        if (screenStream) {
            screenStream.getVideoTracks()[0].onended = () => stopRecording();
        }

        mediaRecorder.start(1000);

        const indicator = document.getElementById('recordingIndicator');
        if (indicator) indicator.style.display = 'flex';

        recordingStartTime = Date.now();
        recordingTimer = setInterval(updateRecordingTime, 1000);

        toast('Aufnahme gestartet - erkläre deine Änderungswünsche!', 'success');

    } catch (e) {
        toast('Aufnahme konnte nicht gestartet werden: ' + e.message, 'error');
        isRecording = false;
        cleanupStreams();
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

    closePip();
    cleanupStreams();
}

/**
 * Räumt Media Streams auf
 */
export function cleanupStreams() {
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
        toast('Fehler beim Speichern: ' + e.message, 'error');
    }
}
