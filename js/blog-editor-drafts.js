/* blog-editor-drafts.js
 * Entwürfe & Posts Management
 * Zeilen: ~280 | Verantwortung: Draft CRUD, Post-Liste
 * Abhängigkeiten: blog-editor-config.js, blog-editor-utils.js
 */

// ============================================
// DRAFTS LADEN & SPEICHERN
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

// ============================================
// POST ERSTELLEN
// ============================================

function createNewPost(showTemplateModal = true) {
    const skipTemplateModal = localStorage.getItem('blog_skip_template_modal') === 'true';

    if (showTemplateModal && !skipTemplateModal) {
        openTemplateModal();
    } else {
        createPostFromTemplate('empty');
    }
}

function createNewPostSilent() {
    createPostFromTemplate('empty');
}

function createPostFromTemplate(templateId) {
    const template = POST_TEMPLATES.find(t => t.id === templateId) || POST_TEMPLATES[0];

    const post = {
        id: Date.now(),
        title: '',
        excerpt: '',
        content: '',
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

// ============================================
// TEMPLATE MODAL
// ============================================

function openTemplateModal(isInitial = false) {
    const modal = document.getElementById('templateModal');
    const grid = document.getElementById('templateGrid');

    if (modal && grid) {
        grid.innerHTML = POST_TEMPLATES.map(t => `
            <div class="template-card" onclick="createPostFromTemplate('${t.id}')">
                <div class="template-card-icon">${t.icon}</div>
                <div class="template-card-name">${t.name}</div>
                <div class="template-card-desc">${t.description}</div>
            </div>
        `).join('');

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

function toggleTemplateModalPreference(checkbox) {
    localStorage.setItem('blog_skip_template_modal', checkbox.checked ? 'true' : 'false');
}

function resetTemplateModalPreference() {
    localStorage.removeItem('blog_skip_template_modal');
    toast('Template-Auswahl wird beim nächsten Start wieder angezeigt', 'success');
}

function openTemplateChooser() {
    const modal = document.getElementById('templateModal');
    const grid = document.getElementById('templateGrid');

    if (modal && grid) {
        grid.innerHTML = POST_TEMPLATES.map(t => `
            <div class="template-card" onclick="applyTemplateToCurrentPost('${t.id}')">
                <div class="template-card-icon">${t.icon}</div>
                <div class="template-card-name">${t.name}</div>
                <div class="template-card-desc">${t.description}</div>
            </div>
        `).join('');

        const dontShowContainer = modal.querySelector('.template-dont-show');
        if (dontShowContainer) dontShowContainer.style.display = 'none';

        modal.classList.add('open');
    }
}

function applyTemplateToCurrentPost(templateId) {
    const template = POST_TEMPLATES.find(t => t.id === templateId) || POST_TEMPLATES[0];

    if (!state.currentPost) {
        createPostFromTemplate(templateId);
        return;
    }

    const hasContent = document.getElementById('postContent')?.innerText?.trim().length > 0;
    if (hasContent) {
        if (!confirm('Der aktuelle Inhalt wird durch das Template ersetzt. Fortfahren?')) {
            return;
        }
    }

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

// ============================================
// POST LADEN & SPEICHERN
// ============================================

function loadPostToEditor(post) {
    document.getElementById('postTitle').value = post.title || '';
    document.getElementById('postExcerpt').value = post.excerpt || '';
    document.getElementById('postContent').innerHTML = post.content || '<p></p>';
    document.getElementById('metaTitle').value = post.metaTitle || '';
    document.getElementById('metaDescription').value = post.metaDescription || '';
    document.getElementById('urlSlug').value = post.slug || '';
    document.getElementById('featuredImageAlt').value = post.featuredImageAlt || '';

    // Block-Editor
    if (typeof blocks !== 'undefined' && typeof htmlToBlocks === 'function') {
        if (post.blocks && post.blocks.length > 0) {
            blocks = JSON.parse(JSON.stringify(post.blocks));
            if (typeof renderBlocks === 'function') renderBlocks();
        } else if (post.content) {
            htmlToBlocks(post.content);
        } else {
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

    if (typeof blocksToHtml === 'function' && typeof blocks !== 'undefined' && blocks.length > 0) {
        state.currentPost.content = blocksToHtml();
        state.currentPost.blocks = JSON.parse(JSON.stringify(blocks));
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

    if (state.currentPost) {
        saveVersion(state.currentPost);
    }

    state.hasUnsavedChanges = false;
    updateStatus('saved');
    toast('Entwurf gespeichert', 'success');
}

// ============================================
// POST-LISTE
// ============================================

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

    if (state.searchQuery) {
        posts = posts.filter(p => matchesSearch(p, state.searchQuery));
    }

    if (posts.length === 0) {
        const message = state.searchQuery
            ? `Keine Beiträge für "${state.searchQuery}" gefunden`
            : 'Keine Beiträge vorhanden';
        container.innerHTML = `<div class="post-item-empty">${message}</div>`;
        return;
    }

    container.innerHTML = posts.map(post => `
        <div class="post-item ${state.currentPost?.id === post.id ? 'active' : ''}"
             onclick="selectPost(${post.id})">
            <div class="post-item-content">
                <div class="post-item-title">${escapeHtml(post.title) || 'Ohne Titel'}</div>
                <div class="post-item-meta">
                    ${formatDate(post.updatedAt)}
                    ${post.categories?.length ? ' · ' + post.categories.slice(0, 2).join(', ') : ''}
                </div>
            </div>
            <button class="post-item-delete" onclick="event.stopPropagation(); deletePost(${post.id})" title="Löschen">
                🗑️
            </button>
        </div>
    `).join('');
}

function selectPost(id) {
    const post = state.drafts.find(p => p.id === id);
    if (post) {
        state.currentPost = post;
        loadPostToEditor(post);
        renderPostList();
    }
}

function deletePost(id) {
    if (!confirm('Beitrag wirklich löschen?')) return;

    state.drafts = state.drafts.filter(p => p.id !== id);
    saveDraftsToStorage();

    if (state.currentPost?.id === id) {
        state.currentPost = null;
        document.getElementById('postTitle').value = '';
        document.getElementById('postExcerpt').value = '';
        document.getElementById('postContent').innerHTML = '<p></p>';
    }

    renderPostList();
    toast('Beitrag gelöscht', 'success');
}

function switchTab(tab) {
    state.currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    renderPostList();
}

function searchPosts(query) {
    state.searchQuery = query.toLowerCase();
    renderPostList();
}

function matchesSearch(post, query) {
    return (post.title?.toLowerCase().includes(query) ||
            post.excerpt?.toLowerCase().includes(query) ||
            post.categories?.some(c => c.toLowerCase().includes(query)));
}
