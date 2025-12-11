/**
 * Frame Setup Module
 * Richtet Editing im iframe ein
 * @module frame-setup
 */

import { state } from './state.js';
import { editText } from './text-editor.js';
import { editImage, setupImageResize } from './image-editor.js';
import { editVideo, editNativeVideo } from './video-editor.js';
import { showFormatToolbar, hideFormatToolbar } from './format-toolbar.js';
import { showContextMenu } from './context-menu.js';
import { hasBackgroundImage, setupBackgroundEditing } from './background-editor.js';
import { isColorEditable, setupSectionColorEditing } from './section-color-editor.js';

/**
 * Richtet alle Editing-Features im Frame ein
 * @param {HTMLIFrameElement} frame - Der iframe mit der Seite
 */
export function setupFrameEditing(frame) {
    const doc = frame.contentDocument;
    if (!doc) return;

    setupTextEditing(doc);
    setupPlaceholderEditing(doc);
    setupImageEditing(doc);
    setupVideoEditing(doc);
    setupBackgroundImageEditing(doc);
    setupSectionEditing(doc);
    setupLinkPrevention(doc);
    setupSelectionToolbar(doc, frame);
    setupContextMenu(doc, frame);
}

/**
 * Richtet Text-Editing ein
 * @param {Document} doc - iframe Document
 */
function setupTextEditing(doc) {
    const textSelectors = [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'li', 'label', 'span', 'button', 'td', 'th', 'a',
        '.btn', '.nav-cta', '.cta-question', '.quiz-question',
        '.quiz-answer', '.question-text', '.answer-text', '.option-text',
        '[data-question]', '[data-answer]'
    ].join(',');

    doc.querySelectorAll(textSelectors).forEach((el, i) => {
        const txt = el.textContent.trim();
        const isButton = el.tagName === 'BUTTON' || el.tagName === 'A' || el.classList.contains('btn');
        const minLength = isButton ? 1 : 2;

        // Text muss mindestens minLength Zeichen haben und keine verschachtelten Elemente
        if (txt.length >= minLength &&
            !el.querySelector('img') &&
            !el.querySelector('input') &&
            !el.querySelector('textarea')) {

            el.dataset.editIdx = i;
            el.dataset.editOrig = txt;
            el.style.cursor = 'text';

            el.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                editText(el, e);
            });
        }
    });
}

/**
 * Richtet Placeholder-Editing für Inputs ein
 * @param {Document} doc - iframe Document
 */
function setupPlaceholderEditing(doc) {
    doc.querySelectorAll('input[placeholder], textarea[placeholder]').forEach((input, i) => {
        const placeholder = input.placeholder;
        if (placeholder && placeholder.length > 1) {
            input.dataset.editIdx = 'placeholder-' + i;
            input.dataset.editOrig = placeholder;

            input.addEventListener('dblclick', (e) => {
                e.preventDefault();
                e.stopPropagation();

                const newPlaceholder = prompt('Neuer Platzhalter-Text:', placeholder);
                if (newPlaceholder && newPlaceholder !== placeholder) {
                    input.placeholder = newPlaceholder;
                    input.style.outline = '2px solid #4CAF50';

                    // Change registrieren
                    import('./state.js').then(({ addPendingChange }) => {
                        addPendingChange({
                            type: 'placeholder',
                            idx: input.dataset.editIdx,
                            orig: placeholder,
                            newVal: newPlaceholder,
                            page: state.currentPage,
                            timestamp: Date.now()
                        });
                    });

                    import('./ui.js').then(({ toast, updateStatus, updateChangesList }) => {
                        updateStatus('unsaved');
                        updateChangesList();
                        toast('Platzhalter geändert', 'success');
                    });
                }
            });
        }
    });
}

/**
 * Richtet Bild-Editing ein
 * @param {Document} doc - iframe Document
 */
function setupImageEditing(doc) {
    doc.querySelectorAll('img').forEach((img, i) => {
        if (img.src && !img.src.startsWith('data:')) {
            img.dataset.editIdx = i;
            img.dataset.editOrig = img.src;

            img.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                editImage(img);
            });

            // Resize-Handles
            setupImageResize(img, doc);
        }
    });
}

/**
 * Richtet Video-Editing ein
 * @param {Document} doc - iframe Document
 */
function setupVideoEditing(doc) {
    // YouTube/Vimeo iframes
    doc.querySelectorAll('iframe').forEach((iframe, i) => {
        const src = iframe.src || '';
        if (src.includes('youtube') || src.includes('vimeo')) {
            // Wrapper für Overlay
            const wrapper = doc.createElement('div');
            wrapper.style.cssText = 'position:relative;display:inline-block;width:100%;';
            iframe.parentNode.insertBefore(wrapper, iframe);
            wrapper.appendChild(iframe);

            // Klick-Overlay
            const overlay = doc.createElement('div');
            overlay.className = 'video-overlay';
            overlay.dataset.editIdx = i;
            overlay.dataset.editOrig = src;
            wrapper.appendChild(overlay);

            overlay.addEventListener('click', (e) => {
                e.preventDefault();
                editVideo(iframe, overlay);
            });
        }
    });

    // Native Video-Elemente
    doc.querySelectorAll('video').forEach((video, i) => {
        video.style.cursor = 'pointer';
        video.dataset.editIdx = 'native-' + i;
        const src = video.src || video.querySelector('source')?.src || '';
        video.dataset.editOrig = src;

        video.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            editNativeVideo(video);
        });
    });
}

/**
 * Verhindert Link-Navigation im Editor
 * @param {Document} doc - iframe Document
 */
function setupLinkPrevention(doc) {
    doc.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', (e) => {
            const href = a.getAttribute('href');
            if (href && !href.startsWith('#')) {
                e.preventDefault();
            }
        });
    });
}

/**
 * Richtet Formatierungs-Toolbar bei Textauswahl ein
 * @param {Document} doc - iframe Document
 * @param {HTMLIFrameElement} frame - Der iframe
 */
function setupSelectionToolbar(doc, frame) {
    doc.addEventListener('mouseup', (e) => {
        const selection = doc.getSelection();
        if (selection && selection.toString().trim().length > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const frameRect = frame.getBoundingClientRect();

            const x = frameRect.left + rect.left;
            const y = frameRect.top + rect.top - 45;

            showFormatToolbar(x, y);
        } else {
            setTimeout(() => {
                const toolbar = document.getElementById('formatToolbar');
                if (toolbar && !toolbar.matches(':hover')) {
                    hideFormatToolbar();
                }
            }, 200);
        }
    });
}

/**
 * Richtet Kontextmenü ein
 * @param {Document} doc - iframe Document
 * @param {HTMLIFrameElement} frame - Der iframe
 */
function setupContextMenu(doc, frame) {
    doc.addEventListener('contextmenu', (e) => {
        e.preventDefault();

        const frameRect = frame.getBoundingClientRect();
        const x = frameRect.left + e.clientX;
        const y = frameRect.top + e.clientY;

        // Prüfe ob Element ein Background hat
        const hasBackground = e.target.dataset?.hasBackground === 'true';

        // Speichere Kontext-Daten
        window.contextMenuData = {
            x,
            y,
            element: e.target,
            hasEditIdx: !!e.target.dataset?.editIdx,
            editIdx: e.target.dataset?.editIdx,
            hasBackground
        };

        showContextMenu(x, y, !!e.target.dataset?.editIdx, hasBackground);
    });
}

/**
 * Richtet Background-Image Editing ein
 * Findet alle Elemente mit CSS background-image
 * @param {Document} doc - iframe Document
 */
function setupBackgroundImageEditing(doc) {
    // Selektoren für typische Hero/Section-Elemente mit Hintergrundbildern
    const bgSelectors = [
        '.hero', '.hero-section', '.hero-background',
        'section[style*="background"]',
        '[class*="hero"]', '[class*="banner"]',
        '.background-image', '.bg-image',
        '.parallax', '.cover-image'
    ].join(',');

    let bgIndex = 0;

    // Prüfe alle Section/Div-Elemente auf Background-Images
    doc.querySelectorAll('section, div, header').forEach((el) => {
        if (hasBackgroundImage(el)) {
            setupBackgroundEditing(el, bgIndex++);
        }
    });

    // Zusätzlich: Elemente mit expliziten Selektoren
    try {
        doc.querySelectorAll(bgSelectors).forEach((el) => {
            if (hasBackgroundImage(el) && !el.dataset.bgEditIdx) {
                setupBackgroundEditing(el, bgIndex++);
            }
        });
    } catch (e) {
        console.warn('Background selector error:', e);
    }
}

/**
 * Richtet Section-Color Editing ein
 * Erlaubt Doppelklick auf Sektionen zum Farben ändern
 * @param {Document} doc - iframe Document
 */
function setupSectionEditing(doc) {
    let colorIndex = 0;

    // Hauptsektionen und Container
    doc.querySelectorAll('section, .section, header, footer, [class*="section"]').forEach((el) => {
        if (isColorEditable(el)) {
            setupSectionColorEditing(el, colorIndex++);
        }
    });
}
