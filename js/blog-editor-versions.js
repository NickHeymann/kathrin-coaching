/* blog-editor-versions.js
 * Versionsverlauf Management
 * Zeilen: ~180 | Verantwortung: Version History
 * Abhängigkeiten: blog-editor-config.js, blog-editor-utils.js
 */

// ============================================
// VERSIONS LADEN & SPEICHERN
// ============================================

function loadVersions() {
    const saved = localStorage.getItem(VERSION_CONFIG.storageKey);
    if (saved) {
        state.versions = JSON.parse(saved);
    }
}

function saveVersionsToStorage() {
    localStorage.setItem(VERSION_CONFIG.storageKey, JSON.stringify(state.versions));
}

// ============================================
// VERSION ERSTELLEN
// ============================================

function saveVersion(post) {
    if (!post || !post.id) return;

    const postId = post.id.toString();

    if (!state.versions[postId]) {
        state.versions[postId] = [];
    }

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
        return;
    }

    state.versions[postId].unshift(version);

    if (state.versions[postId].length > VERSION_CONFIG.maxVersionsPerPost) {
        state.versions[postId] = state.versions[postId].slice(0, VERSION_CONFIG.maxVersionsPerPost);
    }

    saveVersionsToStorage();
}

// ============================================
// VERSIONS MODAL
// ============================================

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

// ============================================
// VERSION PREVIEW & RESTORE
// ============================================

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

// ============================================
// HELPER
// ============================================

function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}
