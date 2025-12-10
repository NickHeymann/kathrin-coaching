/* blog-editor-blocks.js
 * Modulares Block-System für Blog Editor
 * Zeilen: ~350 | Verantwortung: Block-Management, Drag & Drop
 */

// ============================================
// BLOCK TYPES DEFINITION
// ============================================
const BLOCK_TYPES = {
    text: {
        icon: '📝',
        label: 'Text',
        defaultContent: '<p>Text hier eingeben...</p>',
        editable: true
    },
    heading: {
        icon: '🔤',
        label: 'Überschrift',
        defaultContent: '<h2>Überschrift</h2>',
        editable: true
    },
    image: {
        icon: '📷',
        label: 'Bild',
        defaultContent: '',
        editable: false
    },
    video: {
        icon: '🎬',
        label: 'Video',
        defaultContent: '',
        editable: false
    },
    recording: {
        icon: '📹',
        label: 'Aufnahme',
        defaultContent: '',
        editable: false
    },
    code: {
        icon: '</>',
        label: 'Custom Code',
        defaultContent: '<!-- Custom HTML hier -->',
        editable: true,
        isCode: true
    },
    quote: {
        icon: '❝',
        label: 'Zitat',
        defaultContent: '<blockquote>Zitat hier...</blockquote>',
        editable: true
    },
    divider: {
        icon: '―',
        label: 'Trennlinie',
        defaultContent: '<hr>',
        editable: false
    },
    callout: {
        icon: '💡',
        label: 'Highlight-Box',
        defaultContent: '<div class="callout">Wichtiger Hinweis...</div>',
        editable: true
    }
};

// ============================================
// BLOCK STATE
// ============================================
let blocks = [];
let selectedBlockId = null;
let draggedBlockId = null;

// ============================================
// HISTORY SYSTEM (Undo/Redo)
// ============================================
const MAX_HISTORY = 50;
let blockHistory = [];
let historyIndex = -1;
let isUndoRedo = false; // Verhindert History-Speicherung während Undo/Redo

/**
 * Speichert aktuellen Block-State in History
 */
function saveToHistory() {
    if (isUndoRedo) return;

    // Entferne alle Einträge nach aktuellem Index (bei neuem Edit nach Undo)
    if (historyIndex < blockHistory.length - 1) {
        blockHistory = blockHistory.slice(0, historyIndex + 1);
    }

    // Deep copy des aktuellen States
    const snapshot = JSON.stringify(blocks);

    // Nur speichern wenn sich was geändert hat
    if (blockHistory.length > 0 && blockHistory[blockHistory.length - 1] === snapshot) {
        return;
    }

    blockHistory.push(snapshot);
    historyIndex = blockHistory.length - 1;

    // Max History begrenzen
    if (blockHistory.length > MAX_HISTORY) {
        blockHistory.shift();
        historyIndex--;
    }

    updateUndoRedoButtons();
}

/**
 * Undo - Einen Schritt zurück
 */
function undo() {
    if (historyIndex <= 0) {
        toast('Nichts zum Rückgängig machen', 'info');
        return;
    }

    isUndoRedo = true;
    historyIndex--;
    blocks = JSON.parse(blockHistory[historyIndex]);
    renderBlocks();
    isUndoRedo = false;

    updateUndoRedoButtons();
    onContentChange();
    toast('Rückgängig gemacht', 'success');
}

/**
 * Redo - Einen Schritt vorwärts
 */
function redo() {
    if (historyIndex >= blockHistory.length - 1) {
        toast('Nichts zum Wiederherstellen', 'info');
        return;
    }

    isUndoRedo = true;
    historyIndex++;
    blocks = JSON.parse(blockHistory[historyIndex]);
    renderBlocks();
    isUndoRedo = false;

    updateUndoRedoButtons();
    onContentChange();
    toast('Wiederhergestellt', 'success');
}

/**
 * Aktualisiert Undo/Redo Button-Status
 */
function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undoBlockBtn');
    const redoBtn = document.getElementById('redoBlockBtn');

    if (undoBtn) {
        undoBtn.disabled = historyIndex <= 0;
        undoBtn.style.opacity = historyIndex <= 0 ? '0.4' : '1';
    }
    if (redoBtn) {
        redoBtn.disabled = historyIndex >= blockHistory.length - 1;
        redoBtn.style.opacity = historyIndex >= blockHistory.length - 1 ? '0.4' : '1';
    }
}

/**
 * Setzt History zurück (bei neuem Post)
 */
function clearHistory() {
    blockHistory = [];
    historyIndex = -1;
    saveToHistory(); // Initial state speichern
}

// ============================================
// BLOCK CRUD OPERATIONS
// ============================================

/**
 * Erstellt einen neuen Block
 */
function createBlock(type, content = null, position = null) {
    const blockType = BLOCK_TYPES[type];
    if (!blockType) return null;

    saveToHistory(); // History vor Änderung speichern

    const block = {
        id: 'block-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        type: type,
        content: content || blockType.defaultContent,
        settings: {}
    };

    if (position !== null && position < blocks.length) {
        blocks.splice(position, 0, block);
    } else {
        blocks.push(block);
    }

    renderBlocks();
    selectBlock(block.id);
    onContentChange();
    saveToHistory(); // Neuen State speichern

    return block;
}

/**
 * Löscht einen Block
 */
function deleteBlock(blockId) {
    const index = blocks.findIndex(b => b.id === blockId);
    if (index === -1) return;

    // Bestätigung bei großen Blöcken
    const block = blocks[index];
    if (block.content && block.content.length > 200) {
        if (!confirm('Diesen Block wirklich löschen? Er enthält viel Inhalt.')) {
            return;
        }
    }

    saveToHistory(); // History vor Änderung speichern

    blocks.splice(index, 1);

    if (selectedBlockId === blockId) {
        selectedBlockId = null;
    }

    renderBlocks();
    onContentChange();
    saveToHistory(); // Neuen State speichern
}

/**
 * Bewegt Block nach oben/unten
 */
function moveBlock(blockId, direction) {
    const index = blocks.findIndex(b => b.id === blockId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;

    saveToHistory(); // History vor Änderung speichern

    const block = blocks.splice(index, 1)[0];
    blocks.splice(newIndex, 0, block);

    renderBlocks();
    onContentChange();
    saveToHistory(); // Neuen State speichern
}

/**
 * Dupliziert einen Block
 */
function duplicateBlock(blockId) {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    const index = blocks.findIndex(b => b.id === blockId);
    createBlock(block.type, block.content, index + 1);
}

/**
 * Wählt einen Block aus
 */
function selectBlock(blockId) {
    selectedBlockId = blockId;

    document.querySelectorAll('.content-block').forEach(el => {
        el.classList.toggle('selected', el.dataset.blockId === blockId);
    });
}

// ============================================
// BLOCK RENDERING
// ============================================

/**
 * Rendert alle Blöcke
 */
function renderBlocks() {
    const container = document.getElementById('blocksContainer');
    if (!container) return;

    container.innerHTML = blocks.map((block, index) => renderBlock(block, index)).join('');

    // Event Listeners für contenteditable
    container.querySelectorAll('[contenteditable="true"]').forEach(el => {
        el.addEventListener('input', (e) => {
            const blockId = e.target.closest('.content-block').dataset.blockId;
            updateBlockContent(blockId, e.target.innerHTML);
        });

        el.addEventListener('focus', (e) => {
            const blockId = e.target.closest('.content-block').dataset.blockId;
            selectBlock(blockId);
        });
    });

    // Code-Textareas
    container.querySelectorAll('.code-editor').forEach(el => {
        el.addEventListener('input', (e) => {
            const blockId = e.target.closest('.content-block').dataset.blockId;
            updateBlockContent(blockId, e.target.value);
        });
    });

    setupDragAndDrop();
}

/**
 * Rendert einen einzelnen Block
 */
function renderBlock(block, index) {
    const blockType = BLOCK_TYPES[block.type];
    const isSelected = block.id === selectedBlockId;

    return `
        <div class="content-block ${block.type}-block ${isSelected ? 'selected' : ''}"
             data-block-id="${block.id}"
             data-block-type="${block.type}"
             draggable="true">

            <div class="block-toolbar">
                <span class="block-drag-handle" title="Ziehen zum Verschieben">⋮⋮</span>
                <span class="block-type-label">${blockType.icon} ${blockType.label}</span>
                <div class="block-actions">
                    <button onclick="moveBlock('${block.id}', 'up')" title="Nach oben" ${index === 0 ? 'disabled' : ''}>↑</button>
                    <button onclick="moveBlock('${block.id}', 'down')" title="Nach unten" ${index === blocks.length - 1 ? 'disabled' : ''}>↓</button>
                    <button onclick="duplicateBlock('${block.id}')" title="Duplizieren">⧉</button>
                    <button onclick="openBlockSettings('${block.id}')" title="Einstellungen">⚙</button>
                    <button onclick="deleteBlock('${block.id}')" title="Löschen" class="delete-btn">🗑</button>
                </div>
            </div>

            <div class="block-content">
                ${renderBlockContent(block)}
            </div>
        </div>
    `;
}

/**
 * Rendert den Inhalt eines Blocks basierend auf Typ
 */
function renderBlockContent(block) {
    const blockType = BLOCK_TYPES[block.type];

    switch (block.type) {
        case 'text':
        case 'heading':
        case 'quote':
        case 'callout':
            return `<div class="block-editable" contenteditable="true">${block.content}</div>`;

        case 'code':
            return `
                <div class="code-block-wrapper">
                    <div class="code-preview" id="preview-${block.id}">${block.content}</div>
                    <textarea class="code-editor" placeholder="HTML/CSS/JS Code hier...">${escapeHtml(block.content)}</textarea>
                    <button class="toggle-code-btn" onclick="toggleCodeView('${block.id}')">Code anzeigen/bearbeiten</button>
                </div>
            `;

        case 'image':
            if (block.content) {
                return `
                    <div class="image-block-content">
                        <img src="${block.content}" alt="${block.settings.alt || ''}" loading="lazy">
                        <input type="text" class="image-alt-input" placeholder="Alt-Text für SEO..."
                               value="${block.settings.alt || ''}"
                               onchange="updateBlockSettings('${block.id}', 'alt', this.value)">
                    </div>
                `;
            }
            return `
                <div class="image-upload-placeholder" onclick="selectImageForBlock('${block.id}')">
                    <span>📷</span>
                    <p>Klicken um Bild auszuwählen</p>
                </div>
            `;

        case 'video':
            if (block.content) {
                return `<div class="video-embed">${block.content}</div>`;
            }
            return `
                <div class="video-upload-placeholder">
                    <button onclick="insertVideoUrl('${block.id}')">🔗 YouTube/Vimeo URL</button>
                    <button onclick="selectVideoForBlock('${block.id}')">📁 Video hochladen</button>
                </div>
            `;

        case 'recording':
            if (block.content) {
                return `
                    <div class="recording-block-content">
                        <video controls src="${block.content}"></video>
                    </div>
                `;
            }
            return `
                <div class="recording-placeholder" onclick="startRecordingForBlock('${block.id}')">
                    <span>📹</span>
                    <p>Klicken um Video aufzunehmen</p>
                </div>
            `;

        case 'divider':
            return '<hr class="block-divider">';

        default:
            return `<div class="block-editable" contenteditable="true">${block.content}</div>`;
    }
}

// ============================================
// BLOCK UPDATES
// ============================================

function updateBlockContent(blockId, content) {
    const block = blocks.find(b => b.id === blockId);
    if (block) {
        block.content = content;
        onContentChange();
    }
}

function updateBlockSettings(blockId, key, value) {
    const block = blocks.find(b => b.id === blockId);
    if (block) {
        block.settings[key] = value;
        onContentChange();
    }
}

function toggleCodeView(blockId) {
    const wrapper = document.querySelector(`[data-block-id="${blockId}"] .code-block-wrapper`);
    if (wrapper) {
        wrapper.classList.toggle('show-editor');
    }
}

// ============================================
// DRAG & DROP
// ============================================

function setupDragAndDrop() {
    const container = document.getElementById('blocksContainer');
    if (!container) return;

    container.querySelectorAll('.content-block').forEach(block => {
        block.addEventListener('dragstart', handleDragStart);
        block.addEventListener('dragend', handleDragEnd);
        block.addEventListener('dragover', handleDragOver);
        block.addEventListener('drop', handleDrop);
    });
}

function handleDragStart(e) {
    draggedBlockId = e.target.dataset.blockId;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.content-block').forEach(b => b.classList.remove('drag-over'));
    draggedBlockId = null;
}

function handleDragOver(e) {
    e.preventDefault();
    const target = e.target.closest('.content-block');
    if (target && target.dataset.blockId !== draggedBlockId) {
        document.querySelectorAll('.content-block').forEach(b => b.classList.remove('drag-over'));
        target.classList.add('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    const target = e.target.closest('.content-block');
    if (!target || !draggedBlockId) return;

    const fromIndex = blocks.findIndex(b => b.id === draggedBlockId);
    const toIndex = blocks.findIndex(b => b.id === target.dataset.blockId);

    if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
        saveToHistory(); // History vor Änderung speichern
        const block = blocks.splice(fromIndex, 1)[0];
        blocks.splice(toIndex, 0, block);
        renderBlocks();
        onContentChange();
        saveToHistory(); // Neuen State speichern
    }
}

// ============================================
// BLOCK INSERTION HELPERS
// ============================================

function selectImageForBlock(blockId) {
    window.currentImageBlockId = blockId;
    openImageModal();
}

function insertVideoUrl(blockId) {
    const url = prompt('YouTube oder Vimeo URL eingeben:');
    if (!url) return;

    let embedHtml = '';
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (ytMatch) {
        embedHtml = `<iframe src="https://www.youtube.com/embed/${ytMatch[1]}" frameborder="0" allowfullscreen></iframe>`;
    }

    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
        embedHtml = `<iframe src="https://player.vimeo.com/video/${vimeoMatch[1]}" frameborder="0" allowfullscreen></iframe>`;
    }

    if (embedHtml) {
        updateBlockContent(blockId, embedHtml);
        renderBlocks();
    } else {
        toast('Ungültige Video-URL', 'error');
    }
}

function startRecordingForBlock(blockId) {
    window.currentRecordingBlockId = blockId;
    openVideoRecordModal();
}

// ============================================
// BLOCK MENU
// ============================================

function showBlockMenu(position = null) {
    const menu = document.getElementById('blockMenu');
    if (!menu) return;

    menu.classList.add('open');
    menu.dataset.insertPosition = position;
}

function hideBlockMenu() {
    const menu = document.getElementById('blockMenu');
    if (menu) menu.classList.remove('open');
}

function addBlockFromMenu(type) {
    const menu = document.getElementById('blockMenu');
    const position = menu?.dataset.insertPosition;

    createBlock(type, null, position ? parseInt(position) : null);
    hideBlockMenu();
}

// ============================================
// BLOCK SETTINGS
// ============================================
let currentSettingsBlockId = null;

function openBlockSettings(blockId) {
    currentSettingsBlockId = blockId;
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    const modal = document.getElementById('blockSettingsModal');
    modal.classList.add('open');

    // Zeige Hintergrundfarben-Option für Callouts und Quotes
    const bgRow = document.getElementById('bgColorRow');
    bgRow.style.display = ['callout', 'quote'].includes(block.type) ? 'block' : 'none';

    // Aktualisiere Buttons basierend auf aktuellen Einstellungen
    updateSettingsButtons(block.settings);
}

function closeBlockSettings() {
    document.getElementById('blockSettingsModal').classList.remove('open');
    currentSettingsBlockId = null;
}

function updateSettingsButtons(settings) {
    // Reset alle Buttons
    document.querySelectorAll('.setting-option').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.color-option').forEach(btn => btn.classList.remove('active'));

    // Setze aktive Buttons
    const align = settings.align || 'left';
    const width = settings.width || 'full';
    const spacing = settings.spacing || 'none';
    const bgColor = settings.bgColor || 'none';

    document.querySelector(`.setting-option[data-setting="align"][data-value="${align}"]`)?.classList.add('active');
    document.querySelector(`.setting-option[data-setting="width"][data-value="${width}"]`)?.classList.add('active');
    document.querySelector(`.setting-option[data-setting="spacing"][data-value="${spacing}"]`)?.classList.add('active');

    // Farb-Button
    document.querySelectorAll('.color-option').forEach(btn => {
        const color = btn.style.background.includes('transparent') ? 'none' : btn.style.backgroundColor;
        if ((bgColor === 'none' && btn.style.background.includes('transparent')) ||
            rgbToHex(btn.style.backgroundColor) === bgColor) {
            btn.classList.add('active');
        }
    });
}

function setBlockSetting(key, value) {
    if (!currentSettingsBlockId) return;

    saveToHistory();

    const block = blocks.find(b => b.id === currentSettingsBlockId);
    if (block) {
        block.settings[key] = value;
        updateSettingsButtons(block.settings);
        applyBlockStyles(currentSettingsBlockId);
        onContentChange();
        saveToHistory();
    }
}

function applyBlockStyles(blockId) {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    const el = document.querySelector(`[data-block-id="${blockId}"]`);
    if (!el) return;

    const settings = block.settings;

    // Ausrichtung
    el.style.textAlign = settings.align || 'left';

    // Breite
    const widthMap = { full: '100%', wide: '75%', medium: '50%' };
    el.style.maxWidth = widthMap[settings.width] || '100%';
    el.style.margin = settings.align === 'center' ? '0 auto' : '';

    // Abstand
    const spacingMap = { none: '1rem', small: '1.5rem', large: '3rem' };
    el.style.marginTop = spacingMap[settings.spacing] || '1rem';
    el.style.marginBottom = spacingMap[settings.spacing] || '1rem';

    // Hintergrundfarbe
    if (settings.bgColor && settings.bgColor !== 'none') {
        const content = el.querySelector('.block-content');
        if (content) content.style.background = settings.bgColor;
    }
}

function rgbToHex(rgb) {
    if (!rgb || rgb === 'transparent') return 'none';
    const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!match) return rgb;
    return '#' + [match[1], match[2], match[3]].map(x => {
        const hex = parseInt(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

// ============================================
// EXPORT TO HTML
// ============================================

function blocksToHtml() {
    return blocks.map(block => {
        switch (block.type) {
            case 'code':
                return block.content; // Raw HTML ausgeben
            case 'image':
                return block.content ?
                    `<img src="${block.content}" alt="${block.settings.alt || ''}" loading="lazy">` : '';
            case 'video':
            case 'recording':
                return block.content ?
                    `<div class="video-container">${block.content}</div>` : '';
            default:
                return block.content;
        }
    }).join('\n');
}

/**
 * Importiert HTML und konvertiert zu Blöcken
 */
function htmlToBlocks(html) {
    blocks = [];

    // Einfacher HTML-Parser
    const temp = document.createElement('div');
    temp.innerHTML = html;

    temp.childNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
            const tag = node.tagName.toLowerCase();

            if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
                blocks.push({ id: generateBlockId(), type: 'heading', content: node.outerHTML, settings: {} });
            } else if (tag === 'img') {
                blocks.push({ id: generateBlockId(), type: 'image', content: node.src, settings: { alt: node.alt } });
            } else if (tag === 'blockquote') {
                blocks.push({ id: generateBlockId(), type: 'quote', content: node.outerHTML, settings: {} });
            } else if (tag === 'hr') {
                blocks.push({ id: generateBlockId(), type: 'divider', content: '<hr>', settings: {} });
            } else if (node.classList.contains('callout') || node.classList.contains('highlight-box')) {
                blocks.push({ id: generateBlockId(), type: 'callout', content: node.outerHTML, settings: {} });
            } else if (tag === 'iframe' || node.querySelector('iframe')) {
                blocks.push({ id: generateBlockId(), type: 'video', content: node.outerHTML, settings: {} });
            } else if (tag === 'video' || node.querySelector('video')) {
                blocks.push({ id: generateBlockId(), type: 'recording', content: node.querySelector('video')?.src || '', settings: {} });
            } else {
                blocks.push({ id: generateBlockId(), type: 'text', content: node.outerHTML, settings: {} });
            }
        } else if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
            blocks.push({ id: generateBlockId(), type: 'text', content: `<p>${node.textContent}</p>`, settings: {} });
        }
    });

    renderBlocks();
}

function generateBlockId() {
    return 'block-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// ============================================
// INIT & GLOBALS
// ============================================

function initBlockEditor() {
    const container = document.getElementById('blocksContainer');
    if (!container) return;

    // History zurücksetzen
    clearHistory();

    // Start mit einem leeren Text-Block
    if (blocks.length === 0) {
        createBlock('text', '<p>Beginne hier mit deinem Beitrag...</p>');
    } else {
        renderBlocks();
        saveToHistory(); // Initial state speichern
    }

    // Keyboard Shortcuts für Undo/Redo
    document.addEventListener('keydown', (e) => {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

        if (cmdOrCtrl && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            undo();
        }
        if (cmdOrCtrl && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
            e.preventDefault();
            redo();
        }
    });
}

// Global exports
window.createBlock = createBlock;
window.deleteBlock = deleteBlock;
window.moveBlock = moveBlock;
window.duplicateBlock = duplicateBlock;
window.selectBlock = selectBlock;
window.showBlockMenu = showBlockMenu;
window.hideBlockMenu = hideBlockMenu;
window.addBlockFromMenu = addBlockFromMenu;
window.blocksToHtml = blocksToHtml;
window.htmlToBlocks = htmlToBlocks;
window.initBlockEditor = initBlockEditor;
window.toggleCodeView = toggleCodeView;
window.selectImageForBlock = selectImageForBlock;
window.insertVideoUrl = insertVideoUrl;
window.startRecordingForBlock = startRecordingForBlock;
window.updateBlockSettings = updateBlockSettings;
window.undo = undo;
window.redo = redo;
window.clearHistory = clearHistory;
window.saveToHistory = saveToHistory;
window.openBlockSettings = openBlockSettings;
window.closeBlockSettings = closeBlockSettings;
window.setBlockSetting = setBlockSetting;

console.log('✓ blog-editor-blocks.js geladen (mit Undo/Redo & Settings)');
