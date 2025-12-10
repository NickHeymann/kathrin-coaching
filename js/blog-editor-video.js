/* blog-editor-video.js
 * Video Recording mit Silence Detection für Blog Editor
 * Zeilen: ~280 | Verantwortung: Aufnahme, VAD, Waveform, Preview
 */

// === STATE ===
let videoState = {
    mediaRecorder: null,
    recordedChunks: [],
    stream: null,
    webcamStream: null,
    audioContext: null,
    vadInstance: null,
    silenceRegions: [],  // [{start, end}, ...]
    isRecording: false,
    wavesurfer: null,
    recordedBlob: null,
    videoUrl: null
};

// === MODAL CONTROLS ===

function openVideoRecordModal() {
    const modal = document.getElementById('videoRecordModal');
    if (!modal) return;

    modal.classList.add('open');
    initWebcamPreview();
}

function closeVideoRecordModal() {
    const modal = document.getElementById('videoRecordModal');
    if (modal) modal.classList.remove('open');

    stopAllStreams();
    resetVideoState();
}

function resetVideoState() {
    videoState.recordedChunks = [];
    videoState.silenceRegions = [];
    videoState.recordedBlob = null;

    if (videoState.videoUrl) {
        URL.revokeObjectURL(videoState.videoUrl);
        videoState.videoUrl = null;
    }

    // Reset UI
    showRecordingView();
}

// === WEBCAM PREVIEW ===

async function initWebcamPreview() {
    try {
        const preview = document.getElementById('videoRecordPreview');
        if (!preview) return;

        videoState.webcamStream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user'
            },
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });

        preview.srcObject = videoState.webcamStream;
        preview.muted = true;
        preview.play();

        // Init VAD for real-time feedback
        await initVAD(videoState.webcamStream);

        updateStatus('Bereit zur Aufnahme');

    } catch (err) {
        console.error('Webcam Fehler:', err);
        showToast('Kamera-Zugriff verweigert', 'error');
    }
}

// === VAD (Voice Activity Detection) ===

async function initVAD(stream) {
    if (!window.vad) {
        console.warn('VAD nicht geladen');
        return;
    }

    try {
        videoState.vadInstance = await vad.MicVAD.new({
            stream: stream,
            onSpeechStart: () => {
                updateVADIndicator(true);
            },
            onSpeechEnd: (audio) => {
                updateVADIndicator(false);

                // Während Aufnahme: Stille-Region tracken
                if (videoState.isRecording) {
                    const currentTime = (Date.now() - videoState.recordingStartTime) / 1000;
                    // Stille beginnt jetzt (Ende der Sprache)
                    videoState.currentSilenceStart = currentTime;
                }
            }
        });

        videoState.vadInstance.start();

    } catch (err) {
        console.error('VAD Init Fehler:', err);
    }
}

function updateVADIndicator(isSpeaking) {
    const indicator = document.getElementById('vadIndicator');
    if (!indicator) return;

    if (isSpeaking) {
        indicator.classList.add('speaking');
        indicator.textContent = '🎤 Spricht...';
    } else {
        indicator.classList.remove('speaking');
        indicator.textContent = '🔇 Stille';
    }
}

// === RECORDING ===

async function startVideoRecording() {
    if (videoState.isRecording) return;

    try {
        // Use existing webcam stream
        if (!videoState.webcamStream) {
            await initWebcamPreview();
        }

        videoState.recordedChunks = [];
        videoState.silenceRegions = [];

        videoState.mediaRecorder = new MediaRecorder(videoState.webcamStream, {
            mimeType: 'video/webm;codecs=vp9,opus'
        });

        videoState.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                videoState.recordedChunks.push(e.data);
            }
        };

        videoState.mediaRecorder.onstop = onRecordingComplete;

        videoState.mediaRecorder.start(1000); // 1s chunks
        videoState.isRecording = true;
        videoState.recordingStartTime = Date.now();
        videoState.currentSilenceStart = null;

        updateRecordingUI(true);
        updateStatus('Aufnahme läuft...');

    } catch (err) {
        console.error('Recording Error:', err);
        showToast('Aufnahme konnte nicht gestartet werden', 'error');
    }
}

function stopVideoRecording() {
    if (!videoState.isRecording || !videoState.mediaRecorder) return;

    videoState.mediaRecorder.stop();
    videoState.isRecording = false;

    if (videoState.vadInstance) {
        videoState.vadInstance.pause();
    }

    updateRecordingUI(false);
    updateStatus('Verarbeite Video...');
}

function onRecordingComplete() {
    videoState.recordedBlob = new Blob(videoState.recordedChunks, { type: 'video/webm' });
    videoState.videoUrl = URL.createObjectURL(videoState.recordedBlob);

    // Wechsle zur Edit-Ansicht
    showEditView();

    // Initialisiere Waveform
    initWaveform(videoState.videoUrl);
}

// === WAVEFORM & SILENCE PREVIEW ===

async function initWaveform(videoUrl) {
    const container = document.getElementById('waveformContainer');
    if (!container || !window.WaveSurfer) {
        console.warn('Wavesurfer nicht geladen');
        return;
    }

    // Destroy existing instance
    if (videoState.wavesurfer) {
        videoState.wavesurfer.destroy();
    }

    videoState.wavesurfer = WaveSurfer.create({
        container: '#waveformContainer',
        waveColor: '#D2AB74',
        progressColor: '#8B7355',
        cursorColor: '#2c3e50',
        height: 100,
        normalize: true,
        backend: 'WebAudio'
    });

    // Load audio from video
    await videoState.wavesurfer.load(videoUrl);

    // Analyze silence
    await analyzeAndMarkSilence();

    updateStatus('Video bereit - Stille-Regionen markiert');
}

async function analyzeAndMarkSilence() {
    if (!videoState.wavesurfer) return;

    const duration = videoState.wavesurfer.getDuration();
    const peaks = videoState.wavesurfer.exportPeaks()[0];

    // Simple silence detection based on amplitude
    const threshold = 0.05;
    const minSilenceDuration = 0.5; // 500ms minimum silence

    let silenceStart = null;
    const samplesPerSecond = peaks.length / duration;

    videoState.silenceRegions = [];

    for (let i = 0; i < peaks.length; i++) {
        const amplitude = Math.abs(peaks[i]);
        const currentTime = i / samplesPerSecond;

        if (amplitude < threshold) {
            if (silenceStart === null) {
                silenceStart = currentTime;
            }
        } else {
            if (silenceStart !== null) {
                const silenceDuration = currentTime - silenceStart;
                if (silenceDuration >= minSilenceDuration) {
                    videoState.silenceRegions.push({
                        start: silenceStart,
                        end: currentTime
                    });
                }
                silenceStart = null;
            }
        }
    }

    // Render silence regions as visual markers
    renderSilenceRegions();
}

function renderSilenceRegions() {
    const container = document.getElementById('silenceMarkers');
    if (!container || !videoState.wavesurfer) return;

    const duration = videoState.wavesurfer.getDuration();
    container.innerHTML = '';

    videoState.silenceRegions.forEach((region, index) => {
        const marker = document.createElement('div');
        marker.className = 'silence-region';
        marker.style.left = (region.start / duration * 100) + '%';
        marker.style.width = ((region.end - region.start) / duration * 100) + '%';
        marker.title = `Stille: ${region.start.toFixed(1)}s - ${region.end.toFixed(1)}s`;
        marker.dataset.index = index;

        // Click to toggle removal
        marker.onclick = () => toggleSilenceRegion(index);

        container.appendChild(marker);
    });

    updateSilenceStats();
}

function toggleSilenceRegion(index) {
    const marker = document.querySelector(`.silence-region[data-index="${index}"]`);
    if (!marker) return;

    marker.classList.toggle('excluded');
    videoState.silenceRegions[index].excluded = marker.classList.contains('excluded');

    updateSilenceStats();
}

function updateSilenceStats() {
    const totalSilence = videoState.silenceRegions
        .filter(r => !r.excluded)
        .reduce((sum, r) => sum + (r.end - r.start), 0);

    const statsEl = document.getElementById('silenceStats');
    if (statsEl) {
        statsEl.textContent = `${videoState.silenceRegions.filter(r => !r.excluded).length} Stille-Regionen (${totalSilence.toFixed(1)}s)`;
    }
}

// === PREVIEW ===

function previewWithoutSilence() {
    const video = document.getElementById('videoEditPreview');
    if (!video || !videoState.videoUrl) return;

    video.src = videoState.videoUrl;
    video.currentTime = 0;

    const activeRegions = videoState.silenceRegions.filter(r => !r.excluded);
    let currentRegionIndex = 0;

    video.ontimeupdate = () => {
        if (currentRegionIndex >= activeRegions.length) return;

        const region = activeRegions[currentRegionIndex];
        if (video.currentTime >= region.start && video.currentTime < region.end) {
            video.currentTime = region.end;
            currentRegionIndex++;
        }
    };

    video.play();
    updateStatus('Vorschau ohne Stille...');
}

// === EXPORT ===

async function exportVideo(removeSilence = true) {
    if (!videoState.recordedBlob) return;

    updateStatus('Exportiere Video...');

    // If no silence removal needed, just save original
    if (!removeSilence || videoState.silenceRegions.filter(r => !r.excluded).length === 0) {
        insertVideoIntoEditor(videoState.videoUrl);
        return;
    }

    // Use FFmpeg.wasm for cutting
    if (window.FFmpeg) {
        await cutVideoWithFFmpeg();
    } else {
        // Fallback: Just use original video
        console.warn('FFmpeg nicht geladen, verwende Original-Video');
        insertVideoIntoEditor(videoState.videoUrl);
    }
}

async function cutVideoWithFFmpeg() {
    // FFmpeg.wasm implementation would go here
    // For now, use the original video
    insertVideoIntoEditor(videoState.videoUrl);
}

function insertVideoIntoEditor(videoUrl) {
    const editor = document.getElementById('postContent');
    if (!editor) return;

    // Create video element HTML
    const videoHtml = `
        <div class="blog-video-container">
            <video controls preload="metadata" style="width: 100%; max-width: 800px; border-radius: 8px;">
                <source src="${videoUrl}" type="video/webm">
            </video>
        </div>
    `;

    // Insert at cursor or end
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const div = document.createElement('div');
        div.innerHTML = videoHtml;
        range.insertNode(div.firstElementChild);
    } else {
        editor.innerHTML += videoHtml;
    }

    closeVideoRecordModal();
    showToast('Video eingefügt!', 'success');
}

// === UI HELPERS ===

function showRecordingView() {
    document.getElementById('recordingView')?.classList.remove('hidden');
    document.getElementById('editView')?.classList.add('hidden');
}

function showEditView() {
    document.getElementById('recordingView')?.classList.add('hidden');
    document.getElementById('editView')?.classList.remove('hidden');

    // Load video into preview player
    const video = document.getElementById('videoEditPreview');
    if (video && videoState.videoUrl) {
        video.src = videoState.videoUrl;
    }
}

function updateRecordingUI(isRecording) {
    const btn = document.getElementById('recordVideoBtn');
    const timer = document.getElementById('recordTimer');

    if (btn) {
        btn.classList.toggle('recording', isRecording);
        btn.textContent = isRecording ? '⏹ Stopp' : '⏺ Aufnahme starten';
    }

    if (timer) {
        if (isRecording) {
            startRecordingTimer();
        } else {
            stopRecordingTimer();
        }
    }
}

let recordingTimerInterval = null;

function startRecordingTimer() {
    const timer = document.getElementById('recordTimer');
    let seconds = 0;

    recordingTimerInterval = setInterval(() => {
        seconds++;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        timer.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    }, 1000);
}

function stopRecordingTimer() {
    if (recordingTimerInterval) {
        clearInterval(recordingTimerInterval);
        recordingTimerInterval = null;
    }
}

function updateStatus(text) {
    const status = document.getElementById('videoRecordStatus');
    if (status) status.textContent = text;
}

function stopAllStreams() {
    if (videoState.webcamStream) {
        videoState.webcamStream.getTracks().forEach(track => track.stop());
        videoState.webcamStream = null;
    }

    if (videoState.vadInstance) {
        videoState.vadInstance.destroy();
        videoState.vadInstance = null;
    }

    if (videoState.wavesurfer) {
        videoState.wavesurfer.destroy();
        videoState.wavesurfer = null;
    }
}

// === EXPORTS (Global) ===
window.openVideoRecordModal = openVideoRecordModal;
window.closeVideoRecordModal = closeVideoRecordModal;
window.startVideoRecording = startVideoRecording;
window.stopVideoRecording = stopVideoRecording;
window.previewWithoutSilence = previewWithoutSilence;
window.exportVideo = exportVideo;
window.toggleSilenceRegion = toggleSilenceRegion;

console.log('✓ blog-editor-video.js geladen');
