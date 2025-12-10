/**
 * Video Recording Module
 * Screen/Webcam Recording für Video-Feedback
 * @module video-recording
 * ~150 Zeilen
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

/**
 * Toggle Recording Modal oder Stop
 */
export function toggleRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        stopRecording();
    } else {
        document.getElementById('recordModal')?.classList.add('active');
    }
}

/**
 * Schließt Record-Setup Modal
 */
export function closeRecordModal() {
    document.getElementById('recordModal')?.classList.remove('active');
}

/**
 * Startet Bildschirm/Audio/Webcam Aufnahme
 */
export async function startRecording() {
    closeRecordModal();

    const useScreen = document.getElementById('recordScreen')?.checked;
    const useMic = document.getElementById('recordMic')?.checked;
    const useCam = document.getElementById('recordCam')?.checked;

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

        // Webcam (optional)
        if (useCam) {
            camStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 320, height: 240 },
                audio: false
            });
            // Webcam-Track wird separat gehandhabt (Picture-in-Picture)
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

        mediaRecorder.start(1000); // Alle 1 Sekunde Daten

        // UI aktualisieren
        const indicator = document.getElementById('recordingIndicator');
        const btn = document.getElementById('recordBtn');
        if (indicator) indicator.style.display = 'flex';
        if (btn) {
            btn.classList.add('recording');
            btn.textContent = '⏹ Stopp';
        }

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
    const btn = document.getElementById('recordBtn');
    if (indicator) indicator.style.display = 'none';
    if (btn) {
        btn.classList.remove('recording');
        btn.textContent = '🎥 Video';
    }

    cleanupStreams();
}

/**
 * Räumt Media Streams auf
 */
function cleanupStreams() {
    [screenStream, audioStream, camStream].forEach(stream => {
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
        }
    });
    screenStream = null;
    audioStream = null;
    camStream = null;
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
