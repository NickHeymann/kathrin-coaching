/**
 * Video Editor Module
 * Video-URL-Bearbeitung und Upload
 * @module video-editor
 */

import { state, addPendingChange } from './state.js';
import { github } from './github-api.js';
import { CONFIG } from './config.js';
import { toast, updateStatus, updateChangesList } from './ui.js';

let currentVideo = null;
let newVideoData = null;
let videoMode = 'url';

/**
 * Öffnet Video-Edit Modal für iframe-basierte Videos
 * @param {HTMLIFrameElement} iframe - Video iframe
 * @param {HTMLElement} overlay - Overlay-Element
 */
export function editVideo(iframe, overlay) {
    currentVideo = { iframe, overlay };
    newVideoData = null;
    videoMode = 'url';

    const modal = document.getElementById('videoModal');
    const input = document.getElementById('videoInput');
    const preview = document.getElementById('videoPreview');
    const fileName = document.getElementById('videoFileName');

    if (input) input.value = overlay.dataset.editOrig;
    if (preview) preview.style.display = 'none';
    if (fileName) fileName.style.display = 'none';
    if (modal) modal.classList.add('active');

    switchVideoTab('url');
}

/**
 * Öffnet Video-Edit Modal für native Videos
 * @param {HTMLVideoElement} video - Video-Element
 */
export function editNativeVideo(video) {
    currentVideo = { video, isNative: true };
    newVideoData = null;
    videoMode = 'upload';

    const modal = document.getElementById('videoModal');
    const preview = document.getElementById('videoPreview');
    const fileName = document.getElementById('videoFileName');

    if (preview) preview.style.display = 'none';
    if (fileName) fileName.style.display = 'none';
    if (modal) modal.classList.add('active');

    switchVideoTab('upload');
}

/**
 * Wechselt zwischen URL und Upload Tab
 * @param {string} tab - 'url' oder 'upload'
 */
export function switchVideoTab(tab) {
    videoMode = tab;

    const urlBtn = document.getElementById('videoTabUrl');
    const uploadBtn = document.getElementById('videoTabUpload');
    const urlSection = document.getElementById('videoUrlSection');
    const uploadSection = document.getElementById('videoUploadSection');

    if (tab === 'url') {
        if (urlBtn) {
            urlBtn.className = 'btn btn-primary';
        }
        if (uploadBtn) {
            uploadBtn.className = 'btn btn-ghost';
        }
        if (urlSection) urlSection.style.display = 'block';
        if (uploadSection) uploadSection.style.display = 'none';
    } else {
        if (urlBtn) {
            urlBtn.className = 'btn btn-ghost';
        }
        if (uploadBtn) {
            uploadBtn.className = 'btn btn-primary';
        }
        if (urlSection) urlSection.style.display = 'none';
        if (uploadSection) uploadSection.style.display = 'block';
    }
}

/**
 * Schließt Video-Edit Modal
 */
export function closeVideoModal() {
    const modal = document.getElementById('videoModal');
    const fileInput = document.getElementById('videoFileInput');
    const preview = document.getElementById('videoPreview');

    if (modal) modal.classList.remove('active');
    if (fileInput) fileInput.value = '';
    if (preview) preview.style.display = 'none';

    currentVideo = null;
    newVideoData = null;
}

/**
 * Verarbeitet hochgeladene Video-Datei
 * @param {File} file - Videodatei
 */
export function handleVideoFile(file) {
    if (!file) return;

    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
        toast('Nur MP4, WebM oder MOV erlaubt', 'error');
        return;
    }

    if (file.size > 50 * 1024 * 1024) {
        toast('Maximale Dateigröße: 50 MB', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        newVideoData = {
            data: e.target.result,
            name: file.name,
            type: file.type
        };

        const preview = document.getElementById('videoPreview');
        const fileName = document.getElementById('videoFileName');

        if (preview) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        }
        if (fileName) {
            fileName.textContent = file.name;
            fileName.style.display = 'block';
        }
    };

    reader.readAsDataURL(file);
}

/**
 * Konvertiert YouTube/Vimeo URL zu Embed URL
 * @param {string} url - Original URL
 * @returns {string|null} Embed URL oder null
 */
function convertToEmbedUrl(url) {
    if (!url) return null;

    // YouTube watch URL
    if (url.includes('youtube.com/watch')) {
        try {
            const id = new URL(url).searchParams.get('v');
            return id ? `https://www.youtube.com/embed/${id}` : null;
        } catch {
            return null;
        }
    }

    // YouTube short URL
    if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1]?.split('?')[0];
        return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    // Vimeo
    if (url.includes('vimeo.com/')) {
        const match = url.match(/vimeo\.com\/(\d+)/);
        return match ? `https://player.vimeo.com/video/${match[1]}` : null;
    }

    // Bereits Embed URL
    if (url.includes('/embed/') || url.includes('player.vimeo.com')) {
        return url;
    }

    return null;
}

/**
 * Bestätigt Video-Änderung
 */
export async function confirmVideo() {
    if (videoMode === 'upload' && newVideoData) {
        await handleVideoUpload();
    } else {
        handleVideoUrl();
    }
}

/**
 * Verarbeitet Video-URL-Änderung
 */
function handleVideoUrl() {
    const input = document.getElementById('videoInput');
    let url = input?.value?.trim();

    if (!url) {
        toast('URL eingeben', 'error');
        return;
    }

    const embedUrl = convertToEmbedUrl(url);
    if (!embedUrl) {
        toast('Nur YouTube oder Vimeo URLs erlaubt', 'error');
        return;
    }

    if (currentVideo?.iframe) {
        currentVideo.iframe.src = embedUrl;
        currentVideo.iframe.style.outline = '3px solid #4CAF50';

        const change = {
            type: 'video',
            idx: currentVideo.overlay.dataset.editIdx,
            orig: currentVideo.overlay.dataset.editOrig,
            newVal: embedUrl,
            page: state.currentPage,
            timestamp: Date.now()
        };

        addPendingChange(change);
        updateStatus('unsaved');
        updateChangesList();
        closeVideoModal();
        toast('Video geändert', 'success');
    }
}

/**
 * Verarbeitet Video-Upload mit Progress-Indikator
 */
async function handleVideoUpload() {
    if (!newVideoData) {
        toast('Bitte Video auswählen', 'error');
        return;
    }

    // Progress-Anzeige starten
    if (typeof window.SharedUI !== 'undefined') {
        window.SharedUI.progress.show({
            message: `Lade "${newVideoData.name}" hoch...`,
            showPercent: true
        });

        // Simuliere Progress (da GitHub API keinen echten Progress liefert)
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress = Math.min(progress + Math.random() * 15, 90);
            window.SharedUI.progress.update(progress);
        }, 500);

        try {
            await github.uploadVideo(newVideoData.name, newVideoData.data);

            clearInterval(progressInterval);
            window.SharedUI.progress.update(100);

            setTimeout(() => {
                window.SharedUI.progress.hide();
            }, 500);

            const videoUrl = `https://raw.githubusercontent.com/${CONFIG.owner}/${CONFIG.repo}/${CONFIG.branch}/videos/${newVideoData.name}`;

            const change = {
                type: 'video-upload',
                idx: currentVideo?.overlay?.dataset?.editIdx || 'native',
                orig: currentVideo?.overlay?.dataset?.editOrig || '',
                newFile: newVideoData.name,
                newUrl: videoUrl,
                page: state.currentPage,
                timestamp: Date.now()
            };

            addPendingChange(change);
            updateStatus('unsaved');
            updateChangesList();
            closeVideoModal();
            toast('Video hochgeladen!', 'success');

        } catch (e) {
            clearInterval(progressInterval);
            window.SharedUI.progress.hide();

            // Error Recovery mit Retry
            window.SharedUI.errorRecovery.show({
                message: 'Video-Upload fehlgeschlagen',
                details: e.message,
                onRetry: () => handleVideoUpload()
            });
        }
    } else {
        // Fallback ohne SharedUI
        try {
            toast('Video wird hochgeladen...', 'info');
            await github.uploadVideo(newVideoData.name, newVideoData.data);

            const videoUrl = `https://raw.githubusercontent.com/${CONFIG.owner}/${CONFIG.repo}/${CONFIG.branch}/videos/${newVideoData.name}`;

            const change = {
                type: 'video-upload',
                idx: currentVideo?.overlay?.dataset?.editIdx || 'native',
                orig: currentVideo?.overlay?.dataset?.editOrig || '',
                newFile: newVideoData.name,
                newUrl: videoUrl,
                page: state.currentPage,
                timestamp: Date.now()
            };

            addPendingChange(change);
            updateStatus('unsaved');
            updateChangesList();
            closeVideoModal();
            toast('Video hochgeladen!', 'success');

        } catch (e) {
            toast('Upload fehlgeschlagen: ' + e.message, 'error');
        }
    }
}

/**
 * Gibt aktuelles Video zurück
 * @returns {Object|null}
 */
export function getCurrentVideo() {
    return currentVideo;
}
