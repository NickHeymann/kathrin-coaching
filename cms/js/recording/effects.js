/**
 * Video Recording Effects Module
 * Background Blur, Audio Processing, Video Filters
 * @module recording/effects
 */

import { isRecording } from './core.js';

// Background Blur State
let blurAnimationId = null;

// Audio Processing State
let audioContext = null;
let audioProcessingNodes = [];

/**
 * Toggle Background Blur
 */
export function toggleBackgroundBlur(enabled) {
    if (isRecording) return;

    const video = document.getElementById('webcamVideo');
    const pip = document.getElementById('webcamPip');
    const strengthRow = document.getElementById('blurStrengthRow');

    if (strengthRow) {
        strengthRow.style.display = enabled ? 'flex' : 'none';
    }

    if (enabled && video && pip) {
        const previewStream = video.srcObject;
        if (previewStream) {
            startBackgroundBlur(video, pip);
        }
    } else {
        stopBackgroundBlur();
    }
}

/**
 * Aktualisiert Blur-Stärke
 */
export function updateBlurStrength() {
    const strength = document.getElementById('blurStrength')?.value || 10;
    const label = document.getElementById('blurStrengthValue');
    if (label) label.textContent = strength + 'px';
}

/**
 * Startet Background Blur mit CSS backdrop-filter
 * Hinweis: Echter Personen-Hintergrund-Blur benötigt ML-Bibliotheken
 */
export function startBackgroundBlur(video, pip) {
    const strength = document.getElementById('blurStrength')?.value || 10;
    video.style.filter = getVideoFilter() + ` blur(${strength}px)`;
    pip.classList.add('blur-active');
}

/**
 * Stoppt Background Blur
 */
export function stopBackgroundBlur() {
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
export function getVideoFilter() {
    const brightness = document.getElementById('camBrightness')?.value || 100;
    const contrast = document.getElementById('camContrast')?.value || 100;
    return `brightness(${brightness}%) contrast(${contrast}%)`;
}

/**
 * Wendet Helligkeit/Kontrast auf Webcam-Video an
 */
export function applyVideoFilters() {
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
 * Erstellt Audio-Processing-Kette mit Compression und Limiting
 * für Live-Verarbeitung während der Aufnahme
 */
export async function createAudioProcessingChain(inputStream) {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioProcessingNodes = [];

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
        compressor.threshold.value = -24;
        compressor.knee.value = 12;
        compressor.ratio.value = 4;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.25;
        audioProcessingNodes.push(compressor);

        // 4. Makeup Gain (Ausgleich nach Kompression)
        const makeupGain = audioContext.createGain();
        makeupGain.gain.value = 1.3;
        audioProcessingNodes.push(makeupGain);

        // 5. Limiter (verhindert Clipping)
        const limiter = audioContext.createDynamicsCompressor();
        limiter.threshold.value = -1;
        limiter.knee.value = 0;
        limiter.ratio.value = 20;
        limiter.attack.value = 0.001;
        limiter.release.value = 0.1;
        audioProcessingNodes.push(limiter);

        const destination = audioContext.createMediaStreamDestination();

        // Kette verbinden
        source.connect(highPass);
        highPass.connect(lowPass);
        lowPass.connect(compressor);
        compressor.connect(makeupGain);
        makeupGain.connect(limiter);
        limiter.connect(destination);

        return destination.stream.getAudioTracks()[0];

    } catch (error) {
        return null;
    }
}

/**
 * Räumt Audio-Processing auf
 */
export function cleanupAudioProcessing() {
    if (audioContext && audioContext.state !== 'closed') {
        audioContext.close().catch(() => {});
    }
    audioContext = null;
    audioProcessingNodes = [];
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
            const blurEnabled = document.getElementById('bgBlur')?.checked;
            if (blurEnabled) {
                const video = document.getElementById('webcamVideo');
                if (video && video.srcObject) {
                    video.style.filter = getVideoFilter() + ` blur(${blurStrength.value}px)`;
                }
            }
        });
    }
}
