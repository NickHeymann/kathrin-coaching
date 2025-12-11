/**
 * Video Recording Module (Barrel Export)
 * Screen/Webcam Recording für Video-Feedback
 * @module video-recording
 */

export {
    toggleRecording,
    closeRecordModal,
    startRecording,
    stopRecording,
    discardRecording,
    saveRecording,
    showRecordSettings,
    isRecording
} from './recording/core.js';

export {
    toggleWebcamPreview,
    updatePreviewResolution,
    setupPipInteraction
} from './recording/pip.js';

export {
    toggleBackgroundBlur,
    updateBlurStrength,
    initRecordingControls
} from './recording/effects.js';
