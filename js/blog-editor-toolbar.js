/* blog-editor-toolbar.js
 * Editor Commands, Toolbar & Color Picker
 * Zeilen: ~290 | Verantwortung: Text Formatting, Colors, Spacing
 * Abhängigkeiten: blog-editor-config.js
 */

// ============================================
// EDITOR COMMANDS
// ============================================

function execCmd(command, value = null) {
    document.execCommand(command, false, value);
    document.getElementById('postContent').focus();
}

function formatBlock(tag) {
    document.execCommand('formatBlock', false, `<${tag}>`);
    document.getElementById('postContent').focus();
}

// ============================================
// TOOLBAR DROPDOWNS
// ============================================

function toggleToolbarDropdown(btn) {
    const dropdown = btn.closest('.toolbar-dropdown');
    const menu = dropdown.querySelector('.toolbar-dropdown-menu');
    const isOpen = menu.classList.contains('open');

    closeAllDropdowns();

    if (!isOpen) {
        menu.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');

        setTimeout(() => {
            document.addEventListener('click', closeDropdownOnOutsideClick);
        }, 10);
    }
}

function closeDropdownOnOutsideClick(e) {
    if (!e.target.closest('.toolbar-dropdown')) {
        closeAllDropdowns();
    }
}

function closeAllDropdowns() {
    document.querySelectorAll('.toolbar-dropdown-menu.open').forEach(menu => {
        menu.classList.remove('open');
    });
    document.querySelectorAll('.toolbar-dropdown-btn[aria-expanded="true"]').forEach(btn => {
        btn.setAttribute('aria-expanded', 'false');
    });
    document.removeEventListener('click', closeDropdownOnOutsideClick);
}

// ============================================
// BLOCK TYPE & FONT
// ============================================

function setBlockType(tag, label) {
    document.execCommand('formatBlock', false, `<${tag}>`);
    document.querySelector('.toolbar-dropdown .dropdown-label').textContent = label;
    closeAllDropdowns();
    document.getElementById('postContent').focus();
    onContentChange();
}

function setFont(fontFamily) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);

    if (range.collapsed) {
        document.getElementById('postContent').style.fontFamily = fontFamily;
    } else {
        const span = document.createElement('span');
        span.style.fontFamily = fontFamily;

        try {
            range.surroundContents(span);
        } catch (e) {
            document.execCommand('fontName', false, fontFamily.split(',')[0].trim());
        }
    }

    const fontName = fontFamily.split(',')[0].replace(/'/g, '').trim();
    document.getElementById('currentFontLabel').textContent = fontName;

    closeAllDropdowns();
    onContentChange();
}

function setFontSize(size) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);

    if (range.collapsed) {
        document.getElementById('postContent').style.fontSize = size;
    } else {
        const span = document.createElement('span');
        span.style.fontSize = size;

        try {
            range.surroundContents(span);
        } catch (e) {
            const sizeNum = parseInt(size);
            const sizeMap = { 12: 1, 14: 2, 16: 3, 18: 4, 20: 5, 24: 6, 28: 7, 32: 7, 36: 7, 48: 7 };
            document.execCommand('fontSize', false, sizeMap[sizeNum] || 3);
        }
    }

    document.getElementById('currentSizeLabel').textContent = parseInt(size);

    closeAllDropdowns();
    onContentChange();
}

// ============================================
// COLOR PICKER
// ============================================

let savedSelection = null;
let activeColorPicker = null;

function saveSelection() {
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
        savedSelection = sel.getRangeAt(0).cloneRange();
    }
}

function restoreSelection() {
    if (savedSelection) {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(savedSelection);
    }
}

function openColorPicker(type) {
    saveSelection();
    closeAllColorPickers();
    closeAllDropdowns();

    const dropdownId = type === 'text' ? 'textColorDropdown' : 'bgColorDropdown';
    const dropdown = document.getElementById(dropdownId);

    if (dropdown) {
        dropdown.classList.add('show');
        activeColorPicker = type;

        dropdown.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const color = swatch.dataset.color;
                applyColor(type, color);
                closeAllColorPickers();
            };
        });
    }
}

function closeAllColorPickers() {
    document.querySelectorAll('.color-picker-dropdown').forEach(d => d.classList.remove('show'));
    activeColorPicker = null;
}

function applyCustomColor(type) {
    const inputId = type === 'text' ? 'textColorCustom' : 'bgColorCustom';
    const color = document.getElementById(inputId)?.value || '#333333';
    applyColor(type, color);
    closeAllColorPickers();
}

function applyColor(type, color) {
    restoreSelection();

    const editor = document.getElementById('postContent');
    if (editor) editor.focus();

    setTimeout(() => {
        restoreSelection();

        if (type === 'text') {
            document.execCommand('foreColor', false, color);
            const indicator = document.getElementById('textColorIndicator');
            if (indicator) indicator.style.background = color;
        } else {
            if (color === 'transparent') {
                document.execCommand('removeFormat', false, null);
            } else {
                document.execCommand('hiliteColor', false, color);
            }
            const icon = document.querySelector('.bg-color-icon');
            if (icon && color !== 'transparent') icon.style.background = color;
        }

        onContentChange();
    }, 10);
}

function setTextColor(color) {
    applyColor('text', color);
}

function setBackgroundColor(color) {
    applyColor('bg', color);
}

// Click-Outside Handler
document.addEventListener('click', (e) => {
    if (!e.target.closest('.toolbar-color-dropdown')) {
        closeAllColorPickers();
    }
});

// ============================================
// LINE HEIGHT & SPACING
// ============================================

function setLineHeight(value) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);

    let block = range.startContainer;
    while (block && block.nodeType !== 1) block = block.parentNode;
    while (block && !['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'BLOCKQUOTE', 'LI'].includes(block.tagName)) {
        block = block.parentNode;
    }

    if (block && block !== document.getElementById('postContent')) {
        block.style.lineHeight = value;
    } else {
        document.getElementById('postContent').style.lineHeight = value;
    }

    onContentChange();
}

function setParagraphSpacing(value) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);

    let block = range.startContainer;
    while (block && block.nodeType !== 1) block = block.parentNode;
    while (block && !['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'BLOCKQUOTE'].includes(block.tagName)) {
        block = block.parentNode;
    }

    if (block && block !== document.getElementById('postContent')) {
        block.style.marginBottom = value;
    } else {
        document.querySelectorAll('#postContent p, #postContent h1, #postContent h2, #postContent h3').forEach(el => {
            el.style.marginBottom = value;
        });
    }

    onContentChange();
}

// ============================================
// INSERT ELEMENTS
// ============================================

function insertHorizontalRule() {
    document.execCommand('insertHorizontalRule', false, null);
    closeAllDropdowns();
    onContentChange();
}

function insertTable() {
    const rows = prompt('Anzahl Zeilen:', '3');
    const cols = prompt('Anzahl Spalten:', '3');

    if (!rows || !cols) return;

    let tableHtml = '<table style="width: 100%; border-collapse: collapse; margin: 1.5rem 0;">';
    for (let r = 0; r < parseInt(rows); r++) {
        tableHtml += '<tr>';
        for (let c = 0; c < parseInt(cols); c++) {
            const tag = r === 0 ? 'th' : 'td';
            tableHtml += `<${tag} style="border: 1px solid #ddd; padding: 0.75rem;">${r === 0 ? 'Spalte ' + (c + 1) : ''}</${tag}>`;
        }
        tableHtml += '</tr>';
    }
    tableHtml += '</table><p></p>';

    document.execCommand('insertHTML', false, tableHtml);
    closeAllDropdowns();
    onContentChange();
}

function insertLink() {
    const url = prompt('Link-URL eingeben:');
    if (url) execCmd('createLink', url);
}

function insertVideo() {
    const url = prompt('YouTube oder Vimeo URL eingeben:');
    if (!url) return;

    let embedUrl = '';
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (ytMatch) embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;

    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;

    if (embedUrl) {
        const html = `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; margin: 1.5rem 0;"><iframe src="${embedUrl}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" frameborder="0" allowfullscreen></iframe></div>`;
        execCmd('insertHTML', html);
    } else {
        toast('Ungültige Video-URL', 'error');
    }
}

function toggleFullscreen() {
    document.querySelector('.editor-container').classList.toggle('fullscreen');
}
