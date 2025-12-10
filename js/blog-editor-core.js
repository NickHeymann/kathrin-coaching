/* blog-editor-core.js
 * Core Editor Functions: Drafts, Publishing, Toolbar, Images
 * Zeilen: ~450 | Verantwortung: Editor Logic (Datei ist groß, aber kohärent)
 * Abhängigkeiten: blog-editor-config.js, blog-editor-utils.js, blog-editor-github.js
 */

// ============================================
// INIT
// ============================================
function initEditor() {
    loadDrafts();
    loadQueue();
    loadVersions();
    loadCustomFonts();
    setupCategoryTags();
    setupEventListeners();
    startAutosave();
    updateStats();
}

// ============================================
// DRAFTS & POSTS
// ============================================
function loadDrafts() {
    const saved = localStorage.getItem('blog_drafts');
    if (saved) {
        state.drafts = JSON.parse(saved);
    }
    renderPostList();
}

function saveDraftsToStorage() {
    localStorage.setItem('blog_drafts', JSON.stringify(state.drafts));
}

function createNewPost(showTemplateModal = true) {
    // Prüfe ob Template-Modal angezeigt werden soll
    const skipTemplateModal = localStorage.getItem('blog_skip_template_modal') === 'true';

    if (showTemplateModal && !skipTemplateModal) {
        openTemplateModal();
    } else {
        // Direkt leeren Beitrag erstellen
        createPostFromTemplate('empty');
    }
}

/**
 * Erstellt einen neuen Post ohne Template-Modal (für Auto-Erstellung)
 */
function createNewPostSilent() {
    createPostFromTemplate('empty');
}

/**
 * Erstellt einen neuen Post mit dem gewählten Template
 */
function createPostFromTemplate(templateId) {
    const template = POST_TEMPLATES.find(t => t.id === templateId) || POST_TEMPLATES[0];

    const post = {
        id: Date.now(),
        title: '',
        excerpt: '',
        content: '', // Wird aus Blöcken generiert
        categories: [],
        featuredImage: null,
        featuredImageAlt: '',
        metaTitle: '',
        metaDescription: '',
        slug: '',
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        templateUsed: templateId
    };

    state.drafts.unshift(post);
    state.currentPost = post;
    saveDraftsToStorage();
    renderPostList();
    loadPostToEditor(post);

    // Template-Blöcke laden
    if (typeof blocks !== 'undefined' && template.blocks) {
        blocks = template.blocks.map(b => ({
            id: 'block-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            type: b.type,
            content: b.content,
            settings: {}
        }));
        if (typeof renderBlocks === 'function') renderBlocks();
        if (typeof clearHistory === 'function') clearHistory();
    }

    closeTemplateModal();
    toast(`Neuer Beitrag mit "${template.name}" erstellt`, 'success');
}

/**
 * Öffnet das Template-Auswahl-Modal
 * @param {boolean} isInitial - Ob es der initiale Aufruf beim Editor-Start ist
 */
function openTemplateModal(isInitial = false) {
    const modal = document.getElementById('templateModal');
    const grid = document.getElementById('templateGrid');

    if (modal && grid) {
        // Render Templates
        grid.innerHTML = POST_TEMPLATES.map(t => `
            <div class="template-card" onclick="createPostFromTemplate('${t.id}')">
                <div class="template-card-icon">${t.icon}</div>
                <div class="template-card-name">${t.name}</div>
                <div class="template-card-desc">${t.description}</div>
            </div>
        `).join('');

        // "Nicht mehr anzeigen" Checkbox nur beim initialen Aufruf zeigen
        const dontShowContainer = modal.querySelector('.template-dont-show');
        if (dontShowContainer) {
            dontShowContainer.style.display = isInitial ? 'flex' : 'none';
        }

        modal.classList.add('open');
    }
}

function closeTemplateModal() {
    const modal = document.getElementById('templateModal');
    if (modal) modal.classList.remove('open');
}

/**
 * Speichert die "Nicht mehr anzeigen" Einstellung
 */
function toggleTemplateModalPreference(checkbox) {
    localStorage.setItem('blog_skip_template_modal', checkbox.checked ? 'true' : 'false');
}

/**
 * Setzt die Template-Modal Einstellung zurück (zeigt es wieder)
 */
function resetTemplateModalPreference() {
    localStorage.removeItem('blog_skip_template_modal');
    toast('Template-Auswahl wird beim nächsten Start wieder angezeigt', 'success');
}

/**
 * Öffnet Template-Auswahl für bestehenden Post (wendet Template auf aktuellen Post an)
 */
function openTemplateChooser() {
    const modal = document.getElementById('templateModal');
    const grid = document.getElementById('templateGrid');

    if (modal && grid) {
        // Render Templates mit Hinweis
        grid.innerHTML = POST_TEMPLATES.map(t => `
            <div class="template-card" onclick="applyTemplateToCurrentPost('${t.id}')">
                <div class="template-card-icon">${t.icon}</div>
                <div class="template-card-name">${t.name}</div>
                <div class="template-card-desc">${t.description}</div>
            </div>
        `).join('');

        // "Nicht mehr anzeigen" verstecken
        const dontShowContainer = modal.querySelector('.template-dont-show');
        if (dontShowContainer) {
            dontShowContainer.style.display = 'none';
        }

        modal.classList.add('open');
    }
}

/**
 * Wendet ein Template auf den aktuellen Post an
 */
function applyTemplateToCurrentPost(templateId) {
    const template = POST_TEMPLATES.find(t => t.id === templateId) || POST_TEMPLATES[0];

    if (!state.currentPost) {
        createPostFromTemplate(templateId);
        return;
    }

    // Warnung wenn bereits Inhalt vorhanden
    const hasContent = document.getElementById('postContent')?.innerText?.trim().length > 0;
    if (hasContent) {
        if (!confirm('Der aktuelle Inhalt wird durch das Template ersetzt. Fortfahren?')) {
            return;
        }
    }

    // Template-Blöcke anwenden
    if (typeof blocks !== 'undefined' && template.blocks) {
        blocks = template.blocks.map(b => ({
            id: 'block-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            type: b.type,
            content: b.content,
            settings: {}
        }));
        if (typeof renderBlocks === 'function') renderBlocks();
        if (typeof clearHistory === 'function') clearHistory();
    }

    state.currentPost.templateUsed = templateId;
    state.hasUnsavedChanges = true;

    closeTemplateModal();
    toast(`Template "${template.name}" angewendet`, 'success');
}

function loadPostToEditor(post) {
    document.getElementById('postTitle').value = post.title || '';
    document.getElementById('postExcerpt').value = post.excerpt || '';
    document.getElementById('postContent').innerHTML = post.content || '<p></p>';
    document.getElementById('metaTitle').value = post.metaTitle || '';
    document.getElementById('metaDescription').value = post.metaDescription || '';
    document.getElementById('urlSlug').value = post.slug || '';
    document.getElementById('featuredImageAlt').value = post.featuredImageAlt || '';

    // Block-Editor: Lade Blöcke wenn vorhanden
    if (typeof blocks !== 'undefined' && typeof htmlToBlocks === 'function') {
        if (post.blocks && post.blocks.length > 0) {
            // Post hat bereits Block-Daten
            blocks = JSON.parse(JSON.stringify(post.blocks));
            if (typeof renderBlocks === 'function') renderBlocks();
        } else if (post.content) {
            // Konvertiere HTML zu Blöcken
            htmlToBlocks(post.content);
        } else {
            // Neuer Post: Starte mit leerem Text-Block
            blocks = [];
            if (typeof createBlock === 'function') createBlock('text');
        }
    }

    // Kategorien
    state.selectedCategories = post.categories || [];
    document.querySelectorAll('.category-tag').forEach(tag => {
        tag.classList.toggle('active', state.selectedCategories.includes(tag.dataset.cat));
    });

    // Featured Image
    const upload = document.getElementById('featuredImageUpload');
    if (post.featuredImage) {
        upload.innerHTML = `<img src="${post.featuredImage}" alt="" loading="lazy">`;
        upload.classList.add('has-image');
        state.featuredImage = post.featuredImage;
    } else {
        upload.innerHTML = `
            <div class="upload-text">
                <div class="upload-icon">📷</div>
                <div>Bild hochladen oder ziehen</div>
            </div>
        `;
        upload.classList.remove('has-image');
        state.featuredImage = null;
    }

    updateStats();
    state.hasUnsavedChanges = false;
}

function saveCurrentPostToState() {
    if (!state.currentPost) return;

    state.currentPost.title = document.getElementById('postTitle').value;
    state.currentPost.excerpt = document.getElementById('postExcerpt').value;

    // Block-Editor: Konvertiere Blöcke zu HTML
    if (typeof blocksToHtml === 'function' && typeof blocks !== 'undefined' && blocks.length > 0) {
        state.currentPost.content = blocksToHtml();
        state.currentPost.blocks = JSON.parse(JSON.stringify(blocks)); // Deep copy
    } else {
        state.currentPost.content = document.getElementById('postContent').innerHTML;
    }

    state.currentPost.categories = state.selectedCategories;
    state.currentPost.featuredImage = state.featuredImage;
    state.currentPost.featuredImageAlt = document.getElementById('featuredImageAlt').value;
    state.currentPost.metaTitle = document.getElementById('metaTitle').value;
    state.currentPost.metaDescription = document.getElementById('metaDescription').value;
    state.currentPost.slug = document.getElementById('urlSlug').value || generateSlug(state.currentPost.title);
    state.currentPost.updatedAt = new Date().toISOString();
}

function saveDraft() {
    saveCurrentPostToState();
    saveDraftsToStorage();

    // Version speichern bei explizitem Speichern
    if (state.currentPost) {
        saveVersion(state.currentPost);
    }

    state.hasUnsavedChanges = false;
    updateStatus('saved');
    toast('Entwurf gespeichert', 'success');
}

// ============================================
// VERSIONSVERLAUF
// ============================================

/**
 * Lädt Versionen aus localStorage
 */
function loadVersions() {
    const saved = localStorage.getItem(VERSION_CONFIG.storageKey);
    if (saved) {
        state.versions = JSON.parse(saved);
    }
}

/**
 * Speichert Versionen in localStorage
 */
function saveVersionsToStorage() {
    localStorage.setItem(VERSION_CONFIG.storageKey, JSON.stringify(state.versions));
}

/**
 * Speichert eine neue Version eines Posts
 */
function saveVersion(post) {
    if (!post || !post.id) return;

    const postId = post.id.toString();

    // Initialisiere Array wenn nötig
    if (!state.versions[postId]) {
        state.versions[postId] = [];
    }

    // Erstelle Version-Snapshot
    const version = {
        timestamp: new Date().toISOString(),
        title: post.title || 'Ohne Titel',
        content: post.content || '',
        blocks: typeof blocks !== 'undefined' ? JSON.parse(JSON.stringify(blocks)) : null,
        excerpt: post.excerpt || ''
    };

    // Prüfe ob sich etwas geändert hat
    const lastVersion = state.versions[postId][0];
    if (lastVersion && lastVersion.content === version.content && lastVersion.title === version.title) {
        return; // Keine Änderungen
    }

    // Neue Version am Anfang einfügen
    state.versions[postId].unshift(version);

    // Max Versionen begrenzen
    if (state.versions[postId].length > VERSION_CONFIG.maxVersionsPerPost) {
        state.versions[postId] = state.versions[postId].slice(0, VERSION_CONFIG.maxVersionsPerPost);
    }

    saveVersionsToStorage();
}

/**
 * Öffnet das Versionsverlauf-Modal
 */
function openVersionsModal() {
    if (!state.currentPost) {
        toast('Kein Beitrag ausgewählt', 'error');
        return;
    }

    const modal = document.getElementById('versionsModal');
    const list = document.getElementById('versionsList');

    if (!modal || !list) return;

    const postId = state.currentPost.id.toString();
    const versions = state.versions[postId] || [];

    if (versions.length === 0) {
        list.innerHTML = `
            <div class="versions-empty">
                <p>Noch keine Versionen vorhanden.</p>
                <small>Versionen werden beim Speichern erstellt.</small>
            </div>
        `;
    } else {
        list.innerHTML = versions.map((v, i) => `
            <div class="version-item ${i === 0 ? 'current' : ''}" data-index="${i}">
                <div class="version-info">
                    <div class="version-title">${escapeHtml(v.title)}</div>
                    <div class="version-time">${formatDateTime(v.timestamp)}</div>
                    <div class="version-preview">${escapeHtml(stripHtml(v.content).substring(0, 100))}...</div>
                </div>
                <div class="version-actions">
                    <button class="btn btn-ghost" onclick="previewVersion(${i})">Ansehen</button>
                    ${i > 0 ? `<button class="btn btn-ghost" onclick="restoreVersion(${i})">Wiederherstellen</button>` : '<span class="version-badge">Aktuell</span>'}
                </div>
            </div>
        `).join('');
    }

    modal.classList.add('open');
}

function closeVersionsModal() {
    const modal = document.getElementById('versionsModal');
    if (modal) modal.classList.remove('open');
}

/**
 * Zeigt Vorschau einer Version
 */
function previewVersion(index) {
    const postId = state.currentPost.id.toString();
    const version = state.versions[postId]?.[index];

    if (!version) return;

    const previewHtml = `
        <div style="padding: 2rem;">
            <h2 style="color: var(--primary); margin-bottom: 0.5rem;">${escapeHtml(version.title)}</h2>
            <p style="color: var(--text-light); font-size: 0.9rem; margin-bottom: 1.5rem;">
                Version vom ${formatDateTime(version.timestamp)}
            </p>
            <div style="line-height: 1.8;">${version.content}</div>
        </div>
    `;

    const frame = document.getElementById('previewFrame');
    if (frame) {
        frame.innerHTML = previewHtml;
        document.getElementById('previewModal').classList.add('open');
    }
}

/**
 * Stellt eine frühere Version wieder her
 */
function restoreVersion(index) {
    const postId = state.currentPost.id.toString();
    const version = state.versions[postId]?.[index];

    if (!version) return;

    if (!confirm(`Version vom ${formatDateTime(version.timestamp)} wiederherstellen? Der aktuelle Inhalt wird als neue Version gespeichert.`)) {
        return;
    }

    // Aktuelle Version erst speichern
    saveCurrentPostToState();
    saveVersion(state.currentPost);

    // Version wiederherstellen
    state.currentPost.title = version.title;
    state.currentPost.content = version.content;
    state.currentPost.excerpt = version.excerpt;

    if (version.blocks && typeof blocks !== 'undefined') {
        blocks = JSON.parse(JSON.stringify(version.blocks));
        if (typeof renderBlocks === 'function') renderBlocks();
    }

    loadPostToEditor(state.currentPost);
    saveDraftsToStorage();

    closeVersionsModal();
    toast('Version wiederhergestellt', 'success');
}

/**
 * Entfernt HTML-Tags aus Text
 */
function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

function renderPostList() {
    const container = document.getElementById('postList');
    let posts = [];

    if (state.currentTab === 'drafts') {
        posts = state.drafts.filter(p => p.status === 'draft');
    } else if (state.currentTab === 'scheduled') {
        posts = state.drafts.filter(p => p.status === 'scheduled');
    } else {
        posts = state.drafts.filter(p => p.status === 'published');
    }

    // Suche anwenden
    if (state.searchQuery) {
        posts = posts.filter(p => matchesSearch(p, state.searchQuery));
    }

    if (posts.length === 0) {
        const message = state.searchQuery
            ? `Keine Beiträge für "${state.searchQuery}" gefunden`
            : 'Keine Beiträge vorhanden';
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-light);">
                <p>${message}</p>
            </div>
        `;
        return;
    }

    container.innerHTML = posts.map(post => `
        <div class="post-item ${post.status} ${state.currentPost?.id === post.id ? 'active' : ''}"
             onclick="selectPost(${post.id})">
            <div class="post-item-content">
                <div class="post-title">${highlightSearch(post.title || 'Ohne Titel', state.searchQuery)}</div>
                <div class="post-meta">
                    <span class="post-status ${post.status}">${getStatusLabel(post.status)}</span>
                    <span>${formatDate(post.updatedAt)}</span>
                    ${post.status === 'scheduled' && post.scheduledFor ? `<span class="scheduled-time">📅 ${formatDate(post.scheduledFor)}</span>` : ''}
                </div>
            </div>
            <button class="post-delete-btn" onclick="event.stopPropagation(); deletePost(${post.id})" title="Löschen">🗑</button>
        </div>
    `).join('');
}

/**
 * Hebt Suchbegriffe im Text hervor
 */
function highlightSearch(text, query) {
    if (!query) return escapeHtml(text);

    const escaped = escapeHtml(text);
    const terms = query.split(' ').filter(t => t.length > 0);

    let result = escaped;
    terms.forEach(term => {
        const regex = new RegExp(`(${term})`, 'gi');
        result = result.replace(regex, '<mark>$1</mark>');
    });

    return result;
}

/**
 * Löscht einen Beitrag
 */
function deletePost(id) {
    const post = state.drafts.find(p => p.id === id);
    if (!post) return;

    const title = post.title || 'Ohne Titel';
    const confirmMsg = post.status === 'published'
        ? `"${title}" wirklich löschen? Der Artikel bleibt online, wird aber aus deiner Liste entfernt.`
        : `"${title}" wirklich löschen?`;

    if (!confirm(confirmMsg)) return;

    // Aus drafts entfernen
    state.drafts = state.drafts.filter(p => p.id !== id);
    saveDraftsToStorage();

    // Aus queue entfernen falls vorhanden
    state.queue = state.queue.filter(q => q.id !== id);
    saveQueueToStorage();

    // Falls aktueller Post gelöscht wurde, neuen erstellen oder ersten laden
    if (state.currentPost?.id === id) {
        if (state.drafts.length > 0) {
            state.currentPost = state.drafts[0];
            loadPostToEditor(state.currentPost);
        } else {
            createNewPost();
        }
    }

    renderPostList();
    renderQueue();
    toast('Beitrag gelöscht', 'success');
}

function selectPost(id) {
    if (state.currentPost && state.hasUnsavedChanges) {
        saveCurrentPostToState();
        saveDraftsToStorage();
    }

    const post = state.drafts.find(p => p.id === id);
    if (post) {
        state.currentPost = post;
        loadPostToEditor(post);
        renderPostList();

        // Sidebar auf Mobile automatisch schließen
        if (window.innerWidth <= 768) {
            closeMobileSidebar();
        }
    }
}

function showTab(tab) {
    state.currentTab = tab;
    state.searchQuery = ''; // Suche zurücksetzen beim Tab-Wechsel
    const searchInput = document.getElementById('postSearch');
    if (searchInput) searchInput.value = '';

    document.querySelectorAll('.sidebar-tab').forEach(t => {
        const isActive = t.textContent.toLowerCase().includes(tab);
        t.classList.toggle('active', isActive);
        // Accessibility: aria-selected aktualisieren
        t.setAttribute('aria-selected', isActive);
    });
    renderPostList();
}

/**
 * Filtert Posts nach Suchbegriff
 */
function filterPosts(query) {
    state.searchQuery = query.toLowerCase().trim();
    renderPostList();
}

/**
 * Fuzzy-Matching für Suche
 */
function matchesSearch(post, query) {
    if (!query) return true;

    const searchTerms = query.split(' ').filter(t => t.length > 0);
    const searchableText = [
        post.title || '',
        post.excerpt || '',
        (post.categories || []).join(' ')
    ].join(' ').toLowerCase();

    return searchTerms.every(term => searchableText.includes(term));
}

// ============================================
// PUBLISHING
// ============================================
async function publishPost() {
    if (!state.currentPost) {
        toast('Kein Beitrag ausgewählt', 'error');
        return;
    }

    saveCurrentPostToState();

    if (!state.currentPost.title) {
        toast('Bitte einen Titel eingeben', 'error');
        return;
    }

    updateStatus('publishing');
    toast('Veröffentliche...', 'info');

    try {
        const html = generateBlogPostHTML(state.currentPost);
        const filename = state.currentPost.slug + '.html';

        await github.saveFile(filename, html, `Blog-Post veröffentlicht: ${state.currentPost.title}`);
        await updateBlogIndex(state.currentPost);

        state.currentPost.status = 'published';
        state.currentPost.publishedAt = new Date().toISOString();
        saveDraftsToStorage();

        addToQueue({ ...state.currentPost, queueStatus: 'published' });

        updateStatus('saved');
        renderPostList();
        toast('Erfolgreich veröffentlicht!', 'success');

    } catch (e) {
        console.error('Publishing error:', e);
        updateStatus('error');
        toast('Fehler beim Veröffentlichen: ' + e.message, 'error');
    }
}

function schedulePost() {
    if (!state.currentPost) {
        toast('Kein Beitrag ausgewählt', 'error');
        return;
    }

    const date = document.getElementById('scheduleDate').value;
    const time = document.getElementById('scheduleTime').value || '09:00';

    if (!date) {
        toast('Bitte ein Datum wählen', 'error');
        return;
    }

    saveCurrentPostToState();

    if (!state.currentPost.title) {
        toast('Bitte einen Titel eingeben', 'error');
        return;
    }

    if (!state.currentPost.slug) {
        state.currentPost.slug = generateSlug(state.currentPost.title);
    }

    const scheduledDateTime = new Date(`${date}T${time}:00`);
    const now = new Date();

    // Prüfe ob Datum in der Vergangenheit liegt
    if (scheduledDateTime <= now) {
        if (confirm('Das gewählte Datum liegt in der Vergangenheit. Möchtest du den Beitrag jetzt veröffentlichen?')) {
            publishPost();
            return;
        }
        return;
    }

    state.currentPost.status = 'scheduled';
    state.currentPost.scheduledFor = scheduledDateTime.toISOString();
    saveDraftsToStorage();

    // Aus Queue entfernen falls schon vorhanden, dann neu hinzufügen
    state.queue = state.queue.filter(q => q.id !== state.currentPost.id);
    addToQueue({ ...state.currentPost, queueStatus: 'scheduled' });

    renderPostList();
    showTab('scheduled');
    toast(`Geplant für ${formatDateTime(scheduledDateTime)}`, 'success');
}

/**
 * Entfernt Planung und setzt zurück auf Entwurf
 */
function unschedulePost(id) {
    const post = state.drafts.find(p => p.id === id);
    if (!post) return;

    post.status = 'draft';
    delete post.scheduledFor;
    saveDraftsToStorage();

    state.queue = state.queue.filter(q => q.id !== id);
    saveQueueToStorage();

    renderPostList();
    renderQueue();
    toast('Planung aufgehoben', 'success');
}

/**
 * Formatiert Datum und Uhrzeit schön
 */
function formatDateTime(date) {
    if (typeof date === 'string') date = new Date(date);
    return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function generateBlogPostHTML(post) {
    const categories = post.categories.map(c => `category-${c}`).join(' ');
    const publishDate = new Date().toISOString();

    return `<!doctype html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(post.metaTitle || post.title)} - KATHRIN STAHL</title>
    <meta name="description" content="${escapeHtml(post.metaDescription || post.excerpt)}" />
    <link rel="canonical" href="https://nickheymann.github.io/kathrin-coaching/${post.slug}.html" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escapeHtml(post.metaTitle || post.title)}" />
    ${post.featuredImage ? `<meta property="og:image" content="${post.featuredImage}" />` : ''}
    <link rel='stylesheet' href='wp-content/themes/efor/css/main32d4.css' />
    <link rel='stylesheet' href='wp-content/themes/efor/style32d4.css' />
</head>
<body>
    <div class="blog-post-content">
        <a href="blog.html" class="back-link">&larr; Zurück zum Blog</a>
        <article class="${categories}">
            <h1>${escapeHtml(post.title)}</h1>
            <div class="post-meta">
                <span>Von Kathrin Stahl</span> &bull;
                <span>${formatDate(publishDate)}</span> &bull;
                <span>${calculateReadingTime(post.content)} Min. Lesezeit</span>
            </div>
            ${post.featuredImage ? `<img src="${post.featuredImage}" alt="${escapeHtml(post.featuredImageAlt || post.title)}" class="featured-image" loading="lazy">` : ''}
            <div class="entry-content">${post.content}</div>
        </article>
    </div>
</body>
</html>`;
}

async function updateBlogIndex(post) {
    console.log('Blog-Index würde aktualisiert mit:', post.title);
}

// ============================================
// QUEUE MANAGEMENT
// ============================================
function loadQueue() {
    const saved = localStorage.getItem('blog_queue');
    if (saved) {
        state.queue = JSON.parse(saved);
    }
    renderQueue();
    checkScheduledPosts();
}

function saveQueueToStorage() {
    localStorage.setItem('blog_queue', JSON.stringify(state.queue));
}

function addToQueue(item) {
    state.queue.unshift(item);
    saveQueueToStorage();
    renderQueue();
}

function renderQueue() {
    const container = document.getElementById('queueContent');

    if (state.queue.length === 0) {
        container.innerHTML = `<div style="text-align: center; padding: 2rem; color: var(--text-light);"><p>Keine Beiträge in der Warteschlange</p></div>`;
        return;
    }

    container.innerHTML = state.queue.map((item, index) => `
        <div class="queue-item ${item.queueStatus}">
            <div class="queue-item-title">${escapeHtml(item.title || 'Ohne Titel')}</div>
            <div class="queue-item-meta">
                ${item.queueStatus === 'scheduled' ? `Geplant: ${formatDate(item.scheduledFor)}` : ''}
                ${item.queueStatus === 'published' ? `Veröffentlicht: ${formatDate(item.publishedAt)}` : ''}
            </div>
            <div class="queue-actions">
                ${item.queueStatus === 'scheduled' ? `
                    <button onclick="publishNow(${index})" style="background: var(--success); color: white;">Jetzt veröffentlichen</button>
                    <button onclick="removeFromQueue(${index})" style="background: var(--error); color: white;">Entfernen</button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function toggleQueue() {
    document.getElementById('queuePanel').classList.toggle('open');
}

function removeFromQueue(index) {
    state.queue.splice(index, 1);
    saveQueueToStorage();
    renderQueue();
}

async function publishNow(index) {
    const item = state.queue[index];
    if (!item) return;

    item.queueStatus = 'publishing';
    renderQueue();

    try {
        const html = generateBlogPostHTML(item);
        await github.saveFile(item.slug + '.html', html, `Blog-Post veröffentlicht: ${item.title}`);

        item.queueStatus = 'published';
        item.publishedAt = new Date().toISOString();

        const draft = state.drafts.find(d => d.id === item.id);
        if (draft) {
            draft.status = 'published';
            draft.publishedAt = item.publishedAt;
            saveDraftsToStorage();
        }

        saveQueueToStorage();
        renderQueue();
        renderPostList();
        toast('Erfolgreich veröffentlicht!', 'success');

    } catch (e) {
        item.queueStatus = 'error';
        saveQueueToStorage();
        renderQueue();
        toast('Fehler beim Veröffentlichen', 'error');
    }
}

function checkScheduledPosts() {
    // Sofort beim Laden prüfen
    runScheduledCheck();

    // Dann alle 30 Sekunden prüfen
    setInterval(runScheduledCheck, 30000);
}

function runScheduledCheck() {
    const now = new Date();
    let hasPublished = false;

    // Kopie der Queue durchgehen (da publishNow die Queue verändert)
    const scheduledItems = state.queue.filter(item =>
        item.queueStatus === 'scheduled' && item.scheduledFor
    );

    scheduledItems.forEach(item => {
        if (now >= new Date(item.scheduledFor)) {
            const index = state.queue.findIndex(q => q.id === item.id);
            if (index !== -1) {
                console.log(`Veröffentliche geplanten Beitrag: ${item.title}`);
                publishNow(index);
                hasPublished = true;
            }
        }
    });

    if (hasPublished) {
        renderPostList();
    }
}

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
// SMART TOOLBAR FUNCTIONS
// ============================================

/**
 * Öffnet/schließt ein Toolbar-Dropdown
 */
function toggleToolbarDropdown(btn) {
    const dropdown = btn.closest('.toolbar-dropdown');
    const menu = dropdown.querySelector('.toolbar-dropdown-menu');
    const isOpen = menu.classList.contains('open');

    // Erst alle anderen schließen
    closeAllDropdowns();

    // Dann dieses öffnen/schließen
    if (!isOpen) {
        menu.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');

        // Klick außerhalb schließt Dropdown
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

/**
 * Setzt den Block-Typ (Überschrift, Absatz, etc.)
 */
function setBlockType(tag, label) {
    document.execCommand('formatBlock', false, `<${tag}>`);
    document.querySelector('.toolbar-dropdown .dropdown-label').textContent = label;
    closeAllDropdowns();
    document.getElementById('postContent').focus();
    onContentChange();
}

/**
 * Setzt die Schriftart für die aktuelle Auswahl
 */
function setFont(fontFamily) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);

    if (range.collapsed) {
        // Keine Auswahl - auf den gesamten Editor anwenden
        document.getElementById('postContent').style.fontFamily = fontFamily;
    } else {
        // Auswahl vorhanden - Span um die Auswahl legen
        const span = document.createElement('span');
        span.style.fontFamily = fontFamily;

        try {
            range.surroundContents(span);
        } catch (e) {
            // Fallback bei komplexen Auswahlen
            document.execCommand('fontName', false, fontFamily.split(',')[0].trim());
        }
    }

    // Label aktualisieren
    const fontName = fontFamily.split(',')[0].replace(/'/g, '').trim();
    document.getElementById('currentFontLabel').textContent = fontName;

    closeAllDropdowns();
    onContentChange();
}

/**
 * Setzt die Schriftgröße für die aktuelle Auswahl
 */
function setFontSize(size) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);

    if (range.collapsed) {
        // Keine Auswahl - auf den gesamten Editor anwenden
        document.getElementById('postContent').style.fontSize = size;
    } else {
        // Auswahl vorhanden
        const span = document.createElement('span');
        span.style.fontSize = size;

        try {
            range.surroundContents(span);
        } catch (e) {
            // Fallback
            const sizeNum = parseInt(size);
            const sizeMap = { 12: 1, 14: 2, 16: 3, 18: 4, 20: 5, 24: 6, 28: 7, 32: 7, 36: 7, 48: 7 };
            document.execCommand('fontSize', false, sizeMap[sizeNum] || 3);
        }
    }

    // Label aktualisieren
    document.getElementById('currentSizeLabel').textContent = parseInt(size);

    closeAllDropdowns();
    onContentChange();
}

/**
 * Setzt die Textfarbe
 */
function setTextColor(color) {
    document.execCommand('foreColor', false, color);

    // Indikator aktualisieren
    const indicator = document.getElementById('textColorIndicator');
    if (indicator) indicator.style.background = color;

    onContentChange();
}

/**
 * Setzt die Hintergrundfarbe (Highlight)
 */
function setBackgroundColor(color) {
    document.execCommand('hiliteColor', false, color);

    // Icon aktualisieren
    const icon = document.querySelector('.bg-color-icon');
    if (icon) icon.style.background = color;

    onContentChange();
}

/**
 * Setzt den Zeilenabstand
 */
function setLineHeight(value) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);

    // Finde das nächste Block-Element
    let block = range.startContainer;
    while (block && block.nodeType !== 1) block = block.parentNode;
    while (block && !['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'BLOCKQUOTE', 'LI'].includes(block.tagName)) {
        block = block.parentNode;
    }

    if (block && block !== document.getElementById('postContent')) {
        block.style.lineHeight = value;
    } else {
        // Auf den gesamten Editor anwenden
        document.getElementById('postContent').style.lineHeight = value;
    }

    onContentChange();
}

/**
 * Setzt den Absatzabstand
 */
function setParagraphSpacing(value) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);

    // Finde das nächste Block-Element
    let block = range.startContainer;
    while (block && block.nodeType !== 1) block = block.parentNode;
    while (block && !['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'BLOCKQUOTE'].includes(block.tagName)) {
        block = block.parentNode;
    }

    if (block && block !== document.getElementById('postContent')) {
        block.style.marginBottom = value;
    } else {
        // Alle Absätze im Editor
        document.querySelectorAll('#postContent p, #postContent h1, #postContent h2, #postContent h3').forEach(el => {
            el.style.marginBottom = value;
        });
    }

    onContentChange();
}

/**
 * Fügt eine horizontale Linie ein
 */
function insertHorizontalRule() {
    document.execCommand('insertHorizontalRule', false, null);
    closeAllDropdowns();
    onContentChange();
}

/**
 * Fügt eine Tabelle ein
 */
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

// ============================================
// CUSTOM FONTS
// ============================================

// Gespeicherte Custom Fonts
let customFonts = JSON.parse(localStorage.getItem('blog_custom_fonts') || '[]');

/**
 * Öffnet das Custom Font Modal
 */
function openCustomFontModal() {
    closeAllDropdowns();
    const modal = document.getElementById('customFontModal');
    if (modal) {
        modal.classList.add('open');
        document.getElementById('customFontName').value = '';
        document.getElementById('customFontUrl').value = '';
        document.getElementById('customFontStack').value = 'sans-serif';
        updateCustomFontPreview();
    }
}

function closeCustomFontModal() {
    const modal = document.getElementById('customFontModal');
    if (modal) modal.classList.remove('open');
}

/**
 * Aktualisiert die Vorschau im Custom Font Modal
 */
function updateCustomFontPreview() {
    const name = document.getElementById('customFontName').value || 'Open Sans';
    const url = document.getElementById('customFontUrl').value;
    const fallback = document.getElementById('customFontStack').value;
    const preview = document.getElementById('customFontPreview');

    if (url && preview) {
        // Lade die Schriftart temporär
        const link = document.createElement('link');
        link.href = url;
        link.rel = 'stylesheet';
        link.id = 'tempFontPreview';

        // Entferne alte Vorschau
        const oldLink = document.getElementById('tempFontPreview');
        if (oldLink) oldLink.remove();

        document.head.appendChild(link);

        // Warte kurz, dann zeige Vorschau
        setTimeout(() => {
            preview.style.fontFamily = `'${name}', ${fallback}`;
        }, 300);
    }
}

/**
 * Fügt eine Custom Font hinzu
 */
function addCustomFont() {
    const name = document.getElementById('customFontName').value.trim();
    const url = document.getElementById('customFontUrl').value.trim();
    const fallback = document.getElementById('customFontStack').value || 'sans-serif';

    if (!name) {
        toast('Bitte einen Schriftart-Namen eingeben', 'error');
        return;
    }

    // Font zur Liste hinzufügen
    const fontData = { name, url, fallback };
    customFonts.push(fontData);
    localStorage.setItem('blog_custom_fonts', JSON.stringify(customFonts));

    // Google Font laden falls URL vorhanden
    if (url) {
        const link = document.createElement('link');
        link.href = url;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    }

    // Font-Menü aktualisieren
    updateFontMenu();

    // Font direkt anwenden
    setFont(`'${name}', ${fallback}`);

    closeCustomFontModal();
    toast(`Schriftart "${name}" hinzugefügt`, 'success');
}

/**
 * Aktualisiert das Font-Menü mit Custom Fonts
 */
function updateFontMenu() {
    const menu = document.getElementById('fontMenu');
    if (!menu) return;

    // Entferne alte Custom Font Buttons
    menu.querySelectorAll('.custom-font-item').forEach(el => el.remove());

    // Custom Fonts hinzufügen
    if (customFonts.length > 0) {
        const divider = menu.querySelector('.dropdown-divider');
        if (divider) {
            // Section Title einfügen
            const sectionTitle = document.createElement('div');
            sectionTitle.className = 'dropdown-section-title custom-font-item';
            sectionTitle.textContent = 'Eigene Schriftarten';
            divider.before(sectionTitle);

            // Buttons für Custom Fonts
            customFonts.forEach((font, index) => {
                const btn = document.createElement('button');
                btn.className = 'custom-font-item';
                btn.textContent = font.name;
                btn.style.fontFamily = `'${font.name}', ${font.fallback}`;
                btn.onclick = () => setFont(`'${font.name}', ${font.fallback}`);
                divider.before(btn);
            });
        }
    }
}

/**
 * Lädt Custom Fonts beim Start
 */
function loadCustomFonts() {
    customFonts.forEach(font => {
        if (font.url) {
            const link = document.createElement('link');
            link.href = font.url;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }
    });
    updateFontMenu();
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

// ============================================
// IMAGE HANDLING
// ============================================
function openImageModal() {
    document.getElementById('imageModal').classList.add('open');
    loadImageGallery();
}

function closeImageModal() {
    document.getElementById('imageModal').classList.remove('open');
    state.selectedImage = null;
}

async function loadImageGallery() {
    const gallery = document.getElementById('imageGallery');
    gallery.innerHTML = '<div style="text-align: center; padding: 1rem;">Lade Bilder...</div>';

    const images = await github.listImages();

    if (images.length === 0) {
        gallery.innerHTML = '<div style="text-align: center; padding: 1rem; color: var(--text-light);">Keine Bilder gefunden</div>';
        return;
    }

    gallery.innerHTML = images.map(img => `
        <div class="gallery-item" style="background-image: url('${img.download_url}')" data-url="${img.download_url}" onclick="selectGalleryImage(this)"></div>
    `).join('');
}

function selectGalleryImage(el) {
    document.querySelectorAll('.gallery-item').forEach(i => i.classList.remove('selected'));
    el.classList.add('selected');
    state.selectedImage = el.dataset.url;
}

function insertSelectedImage() {
    const altText = document.getElementById('imageAltText').value;
    if (state.selectedImage) {
        // Prüfe ob ein Block-Bild ausgewählt werden soll
        if (window.currentImageBlockId) {
            updateBlockContent(window.currentImageBlockId, state.selectedImage);
            renderBlocks();
            window.currentImageBlockId = null;
        } else {
            execCmd('insertHTML', `<img src="${state.selectedImage}" alt="${escapeHtml(altText)}" loading="lazy">`);
        }
        closeImageModal();
        toast('Bild eingefügt', 'success');
    } else {
        toast('Bitte ein Bild auswählen', 'error');
    }
}

/**
 * Lädt ein neues Bild hoch mit automatischer Komprimierung
 */
async function uploadNewImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            toast('Bild zu groß (max 10MB)', 'error');
            return;
        }

        toast('Komprimiere und lade hoch...', 'info');

        try {
            // Bild komprimieren
            const result = await compressImageFile(file, {
                maxWidth: 1600,
                maxHeight: 1200,
                quality: 0.82
            });

            const base64ToUpload = result.compressed;

            // Dateinamen generieren
            let filename = `blog-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9]/g, '-')}`;
            if (!result.skipped) {
                filename = filename.replace(/\.[^.]+$/, '.jpg');
            }

            await github.uploadImage(filename, base64ToUpload);
            const imageUrl = `wp-content/uploads/blog/${filename}`;

            // Prüfe ob ein Block-Bild ausgewählt werden soll
            if (window.currentImageBlockId) {
                updateBlockContent(window.currentImageBlockId, imageUrl);
                renderBlocks();
                window.currentImageBlockId = null;
                closeImageModal();
            } else {
                // Zur Galerie hinzufügen und auswählen
                state.selectedImage = imageUrl;
                loadImageGallery(); // Galerie neu laden
            }

            // Zeige Einsparung wenn komprimiert wurde
            if (!result.skipped && result.savings > 0) {
                const originalSize = formatFileSize(getBase64Size(result.original));
                const newSize = formatFileSize(getBase64Size(result.compressed));
                toast(`Hochgeladen (${originalSize} → ${newSize}, ${result.savings}% gespart)`, 'success');
            } else {
                toast('Bild hochgeladen', 'success');
            }
        } catch (err) {
            console.error('Upload error:', err);
            toast('Fehler beim Hochladen: ' + err.message, 'error');
        }
    };

    input.click();
}

async function uploadFeaturedImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            toast('Bild zu groß (max 10MB)', 'error');
            return;
        }

        toast('Komprimiere und lade hoch...', 'info');

        try {
            // Bild komprimieren
            const result = await compressImageFile(file, {
                maxWidth: 1200,
                maxHeight: 800,
                quality: 0.85
            });

            const base64ToUpload = result.compressed;

            // Dateinamen anpassen (immer .jpg für komprimierte Bilder)
            let filename = `featured-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9]/g, '-')}`;
            if (!result.skipped) {
                filename = filename.replace(/\.[^.]+$/, '.jpg');
            }

            await github.uploadImage(filename, base64ToUpload);
            state.featuredImage = `wp-content/uploads/blog/${filename}`;

            const upload = document.getElementById('featuredImageUpload');
            upload.innerHTML = `<img src="${base64ToUpload}" alt="" loading="lazy">`;
            upload.classList.add('has-image');
            state.hasUnsavedChanges = true;

            // Zeige Einsparung wenn komprimiert wurde
            if (!result.skipped && result.savings > 0) {
                const originalSize = formatFileSize(getBase64Size(result.original));
                const newSize = formatFileSize(getBase64Size(result.compressed));
                toast(`Bild hochgeladen (${originalSize} → ${newSize}, ${result.savings}% gespart)`, 'success');
            } else {
                toast('Bild hochgeladen', 'success');
            }
        } catch (err) {
            console.error('Upload error:', err);
            toast('Fehler beim Hochladen: ' + err.message, 'error');
        }
    };

    input.click();
}

// ============================================
// PREVIEW
// ============================================
function openPreview() {
    saveCurrentPostToState();
    const frame = document.getElementById('previewFrame');
    frame.innerHTML = generatePreviewHTML(state.currentPost);
    document.getElementById('previewModal').classList.add('open');
}

function closePreview() {
    document.getElementById('previewModal').classList.remove('open');
}

function setPreviewDevice(device) {
    document.querySelectorAll('.preview-device-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.toLowerCase().includes(device));
    });
    document.getElementById('previewFrame').className = 'preview-frame ' + device;
}

function generatePreviewHTML(post) {
    return `
        <div style="padding: 2rem; font-family: Georgia, serif; max-width: 800px; margin: 0 auto;">
            <h1 style="font-family: 'Gilda Display', Georgia, serif; color: #2C4A47; font-size: 2rem;">${escapeHtml(post?.title || 'Titel')}</h1>
            <div style="color: #666; font-size: 0.9rem; margin-bottom: 1.5rem;">Von Kathrin Stahl &bull; ${formatDate(new Date().toISOString())}</div>
            ${post?.featuredImage ? `<img src="${post.featuredImage}" style="width: 100%; border-radius: 12px; margin-bottom: 1.5rem;" loading="lazy">` : ''}
            <div style="line-height: 1.8; font-size: 1.1rem;">${post?.content || '<p>Kein Inhalt</p>'}</div>
        </div>
    `;
}

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
// EVENT LISTENERS & AUTO-SAVE
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

        // Speichern
        if (cmdOrCtrl && e.key === 's') {
            e.preventDefault();
            saveDraft();
        }

        // Vorschau öffnen
        if (cmdOrCtrl && e.key === 'p') {
            e.preventDefault();
            openPreview();
        }

        // KI-Panel toggle
        if (cmdOrCtrl && e.key === '.') {
            e.preventDefault();
            if (typeof toggleAIPanel === 'function') toggleAIPanel();
        }

        // Link einfügen
        if (cmdOrCtrl && e.key === 'k') {
            e.preventDefault();
            insertLink();
        }

        // Escape - alle Modals/Panels schließen
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

        // "?" oder "Shift+/" für Shortcuts-Hilfe (nur wenn nicht in Input)
        if ((e.key === '?' || (e.shiftKey && e.key === '/')) && !isInTextField(e.target)) {
            e.preventDefault();
            openShortcutsModal();
        }
    });

    // Hilfsfunktion: Prüft ob Element ein Textfeld ist
    function isInTextField(element) {
        const tagName = element.tagName.toLowerCase();
        return tagName === 'input' || tagName === 'textarea' || element.isContentEditable;
    }

    window.onbeforeunload = () => {
        if (state.hasUnsavedChanges) return 'Du hast ungespeicherte Änderungen.';
    };
}

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

    // Auto-erstelle Entwurf wenn noch keiner existiert (silent, ohne Modal)
    if (!state.currentPost) {
        createNewPostSilent();
    }
}

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
// KEYBOARD SHORTCUTS MODAL
// ============================================
function openShortcutsModal() {
    const modal = document.getElementById('shortcutsModal');
    if (modal) {
        modal.classList.add('open');

        // Zeige korrektes Modifier-Symbol basierend auf OS
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

        // Backdrop anzeigen/verstecken
        if (backdrop) {
            backdrop.classList.toggle('visible', isOpen);
        }

        // Body-Scroll deaktivieren wenn Sidebar offen
        document.body.style.overflow = isOpen ? 'hidden' : '';

        // Accessibility: aria-expanded aktualisieren
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

        // Accessibility: aria-expanded aktualisieren
        if (toggleBtn) {
            toggleBtn.setAttribute('aria-expanded', 'false');
            toggleBtn.setAttribute('aria-label', 'Seitenleiste öffnen');
        }
    }
}

// Schließe Sidebar bei Post-Auswahl auf Mobile
function selectPostMobile(id) {
    selectPost(id);
    // Nur auf Mobile schließen
    if (window.innerWidth <= 768) {
        closeMobileSidebar();
    }
}

// ============================================
// EXPORT FUNKTIONEN
// ============================================

/**
 * Öffnet das Export-Modal
 */
function openExportModal() {
    if (!state.currentPost) {
        toast('Kein Beitrag ausgewählt', 'error');
        return;
    }

    const modal = document.getElementById('exportModal');
    if (modal) {
        // Aktualisiere Vorschau-Info
        const previewTitle = modal.querySelector('.export-preview-title');
        if (previewTitle) {
            previewTitle.textContent = state.currentPost.title || 'Ohne Titel';
        }
        modal.classList.add('open');
    }
}

function closeExportModal() {
    const modal = document.getElementById('exportModal');
    if (modal) modal.classList.remove('open');
}

/**
 * Exportiert den aktuellen Beitrag als Markdown
 */
function exportAsMarkdown() {
    if (!state.currentPost) {
        toast('Kein Beitrag ausgewählt', 'error');
        return;
    }

    saveCurrentPostToState();

    const post = state.currentPost;
    const markdown = htmlToMarkdown(post.content);

    // Frontmatter hinzufügen
    const frontmatter = `---
title: "${(post.title || 'Ohne Titel').replace(/"/g, '\\"')}"
date: ${post.createdAt || new Date().toISOString()}
categories: [${post.categories.map(c => `"${c}"`).join(', ')}]
excerpt: "${(post.excerpt || '').replace(/"/g, '\\"')}"
${post.featuredImage ? `featured_image: "${post.featuredImage}"` : ''}
---

`;

    const fullMarkdown = frontmatter + markdown;

    // Download auslösen
    const blob = new Blob([fullMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (post.slug || generateSlug(post.title) || 'beitrag') + '.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    closeExportModal();
    toast('Als Markdown exportiert', 'success');
}

/**
 * Konvertiert HTML zu Markdown
 */
function htmlToMarkdown(html) {
    if (!html) return '';

    let md = html;

    // Zeilenumbrüche normalisieren
    md = md.replace(/\r\n/g, '\n');

    // Überschriften
    md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
    md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
    md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
    md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
    md = md.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n');
    md = md.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n');

    // Formatierung
    md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
    md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
    md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
    md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
    md = md.replace(/<u[^>]*>(.*?)<\/u>/gi, '_$1_');
    md = md.replace(/<del[^>]*>(.*?)<\/del>/gi, '~~$1~~');
    md = md.replace(/<s[^>]*>(.*?)<\/s>/gi, '~~$1~~');

    // Links
    md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

    // Bilder
    md = md.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)');
    md = md.replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*\/?>/gi, '![$1]($2)');
    md = md.replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, '![]($1)');

    // Blockquotes
    md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (match, content) => {
        return content.split('\n').map(line => '> ' + line.trim()).join('\n') + '\n\n';
    });

    // Code
    md = md.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '```\n$1\n```\n\n');
    md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');

    // Listen
    md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, content) => {
        return content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n') + '\n';
    });
    md = md.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, content) => {
        let counter = 0;
        return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => {
            counter++;
            return `${counter}. ` + arguments[1] + '\n';
        }) + '\n';
    });

    // Horizontale Linie
    md = md.replace(/<hr[^>]*\/?>/gi, '\n---\n\n');

    // Absätze
    md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n');

    // Zeilenumbrüche
    md = md.replace(/<br[^>]*\/?>/gi, '  \n');

    // Divs (für Callouts etc.)
    md = md.replace(/<div[^>]*class="[^"]*callout[^"]*"[^>]*>([\s\S]*?)<\/div>/gi, '> **Hinweis:** $1\n\n');
    md = md.replace(/<div[^>]*>([\s\S]*?)<\/div>/gi, '$1\n\n');

    // Restliche Tags entfernen
    md = md.replace(/<[^>]+>/g, '');

    // HTML-Entities dekodieren
    md = md.replace(/&nbsp;/g, ' ');
    md = md.replace(/&amp;/g, '&');
    md = md.replace(/&lt;/g, '<');
    md = md.replace(/&gt;/g, '>');
    md = md.replace(/&quot;/g, '"');
    md = md.replace(/&#039;/g, "'");

    // Mehrfache Leerzeilen bereinigen
    md = md.replace(/\n{3,}/g, '\n\n');

    return md.trim();
}

/**
 * Exportiert den aktuellen Beitrag als PDF (via Browser Print)
 */
function exportAsPDF() {
    if (!state.currentPost) {
        toast('Kein Beitrag ausgewählt', 'error');
        return;
    }

    saveCurrentPostToState();

    const post = state.currentPost;

    // Neues Fenster für PDF-Druck öffnen
    const printWindow = window.open('', '_blank');

    if (!printWindow) {
        toast('Popup-Blocker aktiv. Bitte erlaube Popups für diese Seite.', 'error');
        return;
    }

    const printContent = `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <title>${escapeHtml(post.title || 'Beitrag')} - PDF Export</title>
    <style>
        * { box-sizing: border-box; }

        @page {
            margin: 2.5cm;
            size: A4;
        }

        body {
            font-family: Georgia, 'Times New Roman', serif;
            font-size: 12pt;
            line-height: 1.6;
            color: #333;
            max-width: 100%;
            margin: 0;
            padding: 0;
        }

        h1 {
            font-family: 'Gilda Display', Georgia, serif;
            color: #2C4A47;
            font-size: 24pt;
            margin-bottom: 0.5em;
            line-height: 1.2;
        }

        h2 {
            font-family: 'Gilda Display', Georgia, serif;
            color: #2C4A47;
            font-size: 18pt;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            page-break-after: avoid;
        }

        h3 {
            font-family: 'Gilda Display', Georgia, serif;
            color: #2C4A47;
            font-size: 14pt;
            margin-top: 1.2em;
            margin-bottom: 0.4em;
            page-break-after: avoid;
        }

        p {
            margin: 0 0 1em 0;
            text-align: justify;
            orphans: 3;
            widows: 3;
        }

        .meta {
            color: #666;
            font-size: 10pt;
            margin-bottom: 2em;
            padding-bottom: 1em;
            border-bottom: 1px solid #ddd;
        }

        .featured-image {
            width: 100%;
            max-height: 300px;
            object-fit: cover;
            margin-bottom: 1.5em;
            page-break-inside: avoid;
        }

        blockquote {
            margin: 1.5em 0;
            padding: 1em 1.5em;
            border-left: 4px solid #D2AB74;
            background: #f9f7f4;
            font-style: italic;
            page-break-inside: avoid;
        }

        ul, ol {
            margin: 1em 0;
            padding-left: 2em;
        }

        li {
            margin-bottom: 0.3em;
        }

        .callout {
            background: #f9f7f4;
            border-left: 4px solid #D2AB74;
            padding: 1em 1.5em;
            margin: 1.5em 0;
            page-break-inside: avoid;
        }

        img {
            max-width: 100%;
            height: auto;
            page-break-inside: avoid;
        }

        a {
            color: #2C4A47;
            text-decoration: underline;
        }

        .footer {
            margin-top: 3em;
            padding-top: 1em;
            border-top: 1px solid #ddd;
            font-size: 10pt;
            color: #666;
            text-align: center;
        }

        @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
    </style>
</head>
<body>
    <h1>${escapeHtml(post.title || 'Ohne Titel')}</h1>

    <div class="meta">
        Von Kathrin Stahl &bull;
        ${formatDate(post.createdAt || new Date().toISOString())} &bull;
        ${calculateReadingTime(countWords(stripHtml(post.content)))} Min. Lesezeit
        ${post.categories.length > 0 ? `<br>Kategorien: ${post.categories.map(c => BLOG_CATEGORIES[c] || c).join(', ')}` : ''}
    </div>

    ${post.featuredImage ? `<img src="${post.featuredImage}" alt="${escapeHtml(post.featuredImageAlt || '')}" class="featured-image">` : ''}

    <div class="content">
        ${post.content}
    </div>

    <div class="footer">
        Kathrin Stahl Coaching<br>
        www.kathrinstahl.com
    </div>

    <script>
        // Warte bis alle Bilder geladen sind, dann drucken
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 500);
        };
    </script>
</body>
</html>`;

    printWindow.document.write(printContent);
    printWindow.document.close();

    closeExportModal();
    toast('PDF-Export wird vorbereitet...', 'info');
}

/**
 * Exportiert den aktuellen Beitrag als HTML-Datei
 */
function exportAsHTML() {
    if (!state.currentPost) {
        toast('Kein Beitrag ausgewählt', 'error');
        return;
    }

    saveCurrentPostToState();

    const post = state.currentPost;
    const html = generateBlogPostHTML(post);

    // Download auslösen
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (post.slug || generateSlug(post.title) || 'beitrag') + '.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    closeExportModal();
    toast('Als HTML exportiert', 'success');
}

/**
 * Kopiert den Markdown-Inhalt in die Zwischenablage
 */
async function copyAsMarkdown() {
    if (!state.currentPost) {
        toast('Kein Beitrag ausgewählt', 'error');
        return;
    }

    saveCurrentPostToState();

    const markdown = htmlToMarkdown(state.currentPost.content);

    try {
        await navigator.clipboard.writeText(markdown);
        closeExportModal();
        toast('Markdown in Zwischenablage kopiert', 'success');
    } catch (err) {
        // Fallback für ältere Browser
        const textarea = document.createElement('textarea');
        textarea.value = markdown;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        closeExportModal();
        toast('Markdown in Zwischenablage kopiert', 'success');
    }
}

console.log('✓ blog-editor-core.js geladen');
