/* blog-editor-ui.js
 * Events, Autosave, Mobile, Shortcuts
 * Zeilen: ~220 | Verantwortung: UI Events, Status, Mobile
 * Abhängigkeiten: blog-editor-config.js
 */

// ============================================
// CATEGORIES
// ============================================

function setupCategoryTags() {
    document.querySelectorAll('.category-tag').forEach(tag => {
        tag.onclick = () => {
            tag.classList.toggle('active');
            const cat = tag.dataset.cat;
            if (tag.classList.contains('active')) {
                if (!state.selectedCategories.includes(cat)) state.selectedCategories.push(cat);
            } else {
                state.selectedCategories = state.selectedCategories.filter(c => c !== cat);
            }
            state.hasUnsavedChanges = true;
        };
    });
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    document.getElementById('metaTitle').oninput = (e) => {
        document.getElementById('metaTitleCount').textContent = e.target.value.length;
        onContentChange();
    };

    document.getElementById('metaDescription').oninput = (e) => {
        document.getElementById('metaDescCount').textContent = e.target.value.length;
        onContentChange();
    };

    document.getElementById('postTitle').onblur = () => {
        const slug = document.getElementById('urlSlug');
        if (!slug.value) slug.value = generateSlug(document.getElementById('postTitle').value);
    };

    document.addEventListener('keydown', (e) => {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

        if (cmdOrCtrl && e.key === 's') {
            e.preventDefault();
            saveDraft();
        }

        if (cmdOrCtrl && e.key === 'p') {
            e.preventDefault();
            openPreview();
        }

        if (cmdOrCtrl && e.key === '.') {
            e.preventDefault();
            if (typeof toggleAIPanel === 'function') toggleAIPanel();
        }

        if (cmdOrCtrl && e.key === 'k') {
            e.preventDefault();
            insertLink();
        }

        if (e.key === 'Escape') {
            closePreview();
            closeImageModal();
            closeShortcutsModal();
            closeExportModal();
            closeTemplateModal();
            closeVersionsModal();
            closeBlockSettings();
            closeMobileSidebar();
            hideBlockMenu();
            document.getElementById('queuePanel')?.classList.remove('open');
            document.getElementById('aiPanel')?.classList.remove('open');
        }

        if ((e.key === '?' || (e.shiftKey && e.key === '/')) && !isInTextField(e.target)) {
            e.preventDefault();
            openShortcutsModal();
        }
    });

    function isInTextField(element) {
        const tagName = element.tagName.toLowerCase();
        return tagName === 'input' || tagName === 'textarea' || element.isContentEditable;
    }

    window.onbeforeunload = () => {
        if (state.hasUnsavedChanges) return 'Du hast ungespeicherte Änderungen.';
    };
}

// ============================================
// AUTOSAVE
// ============================================

function startAutosave() {
    setInterval(() => {
        if (state.hasUnsavedChanges && state.currentPost) {
            saveCurrentPostToState();
            saveDraftsToStorage();
            state.hasUnsavedChanges = false;
            updateStatus('autosaved');
        }
    }, 30000);
}

function onContentChange() {
    state.hasUnsavedChanges = true;
    updateStatus('unsaved');
    updateStats();

    if (!state.currentPost) {
        createNewPostSilent();
    }
}

// ============================================
// STATUS & STATS
// ============================================

function updateStatus(status) {
    const dot = document.getElementById('statusDot');
    const text = document.getElementById('statusText');
    const autosaveText = document.getElementById('autosaveText');

    dot.className = 'status-dot';

    const statusMap = {
        saved: { text: 'Gespeichert', autosave: 'Alle Änderungen gespeichert' },
        autosaved: { text: 'Automatisch gespeichert', autosave: 'Autosave aktiv' },
        unsaved: { text: 'Ungespeichert', autosave: 'Änderungen nicht gespeichert', class: 'draft' },
        publishing: { text: 'Veröffentliche...', autosave: '' },
        error: { text: 'Fehler', autosave: '', class: 'error' }
    };

    const s = statusMap[status];
    if (s) {
        text.textContent = s.text;
        autosaveText.textContent = s.autosave;
        if (s.class) dot.classList.add(s.class);
    }
}

function updateStats() {
    const content = document.getElementById('postContent')?.innerText || '';
    const words = countWords(content);
    const chars = content.length;
    const readingTime = calculateReadingTime(words);

    document.getElementById('wordCount').textContent = words;
    document.getElementById('charCount').textContent = chars;
    document.getElementById('readingTime').textContent = readingTime;
}

function updateCharCount(inputId, countId, max) {
    const len = document.getElementById(inputId).value.length;
    document.getElementById(countId).textContent = len;
}

// ============================================
// SHORTCUTS MODAL
// ============================================

function openShortcutsModal() {
    const modal = document.getElementById('shortcutsModal');
    if (modal) {
        modal.classList.add('open');

        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const kbds = modal.querySelectorAll('.shortcut-keys kbd');
        kbds.forEach(kbd => {
            if (kbd.textContent === '⌘') {
                kbd.textContent = isMac ? '⌘' : 'Ctrl';
            }
        });

        const modifierHint = document.getElementById('shortcutModifier');
        if (modifierHint) {
            modifierHint.textContent = isMac
                ? '⌘ = Cmd (Mac)'
                : 'Ctrl = Strg (Windows/Linux)';
        }
    }
}

function closeShortcutsModal() {
    const modal = document.getElementById('shortcutsModal');
    if (modal) modal.classList.remove('open');
}

// ============================================
// MOBILE SIDEBAR
// ============================================

function toggleMobileSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const backdrop = document.querySelector('.sidebar-backdrop');
    const toggleBtn = document.querySelector('.mobile-menu-toggle');

    if (sidebar) {
        sidebar.classList.toggle('open');
        const isOpen = sidebar.classList.contains('open');

        if (backdrop) {
            backdrop.classList.toggle('visible', isOpen);
        }

        document.body.style.overflow = isOpen ? 'hidden' : '';

        if (toggleBtn) {
            toggleBtn.setAttribute('aria-expanded', isOpen);
            toggleBtn.setAttribute('aria-label', isOpen ? 'Seitenleiste schließen' : 'Seitenleiste öffnen');
        }
    }
}

function closeMobileSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const backdrop = document.querySelector('.sidebar-backdrop');
    const toggleBtn = document.querySelector('.mobile-menu-toggle');

    if (sidebar) {
        sidebar.classList.remove('open');
        if (backdrop) backdrop.classList.remove('visible');
        document.body.style.overflow = '';

        if (toggleBtn) {
            toggleBtn.setAttribute('aria-expanded', 'false');
            toggleBtn.setAttribute('aria-label', 'Seitenleiste öffnen');
        }
    }
}

function selectPostMobile(id) {
    selectPost(id);
    if (window.innerWidth <= 768) {
        closeMobileSidebar();
    }
}
