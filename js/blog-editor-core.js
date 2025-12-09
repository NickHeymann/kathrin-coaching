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

function createNewPost() {
    const post = {
        id: Date.now(),
        title: '',
        excerpt: '',
        content: '<p>Beginne hier mit deinem Beitrag...</p>',
        categories: [],
        featuredImage: null,
        featuredImageAlt: '',
        metaTitle: '',
        metaDescription: '',
        slug: '',
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    state.drafts.unshift(post);
    state.currentPost = post;
    saveDraftsToStorage();
    renderPostList();
    loadPostToEditor(post);
    toast('Neuer Entwurf erstellt', 'success');
}

function loadPostToEditor(post) {
    document.getElementById('postTitle').value = post.title || '';
    document.getElementById('postExcerpt').value = post.excerpt || '';
    document.getElementById('postContent').innerHTML = post.content || '<p></p>';
    document.getElementById('metaTitle').value = post.metaTitle || '';
    document.getElementById('metaDescription').value = post.metaDescription || '';
    document.getElementById('urlSlug').value = post.slug || '';
    document.getElementById('featuredImageAlt').value = post.featuredImageAlt || '';

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
    state.currentPost.content = document.getElementById('postContent').innerHTML;
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
    state.hasUnsavedChanges = false;
    updateStatus('saved');
    toast('Entwurf gespeichert', 'success');
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

    if (posts.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-light);">
                <p>Keine Beiträge vorhanden</p>
            </div>
        `;
        return;
    }

    container.innerHTML = posts.map(post => `
        <div class="post-item ${post.status} ${state.currentPost?.id === post.id ? 'active' : ''}"
             onclick="selectPost(${post.id})">
            <div class="post-title">${post.title || 'Ohne Titel'}</div>
            <div class="post-meta">
                <span class="post-status ${post.status}">${getStatusLabel(post.status)}</span>
                <span>${formatDate(post.updatedAt)}</span>
            </div>
        </div>
    `).join('');
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
    }
}

function showTab(tab) {
    state.currentTab = tab;
    document.querySelectorAll('.sidebar-tab').forEach(t => {
        t.classList.toggle('active', t.textContent.toLowerCase().includes(tab));
    });
    renderPostList();
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
    const time = document.getElementById('scheduleTime').value;

    if (!date) {
        toast('Bitte ein Datum wählen', 'error');
        return;
    }

    saveCurrentPostToState();

    state.currentPost.status = 'scheduled';
    state.currentPost.scheduledFor = `${date}T${time}:00`;
    saveDraftsToStorage();

    addToQueue({ ...state.currentPost, queueStatus: 'scheduled' });

    renderPostList();
    toast(`Geplant für ${formatDate(state.currentPost.scheduledFor)}`, 'success');
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
    setInterval(() => {
        const now = new Date();
        state.queue.forEach((item, index) => {
            if (item.queueStatus === 'scheduled' && item.scheduledFor) {
                if (now >= new Date(item.scheduledFor)) {
                    publishNow(index);
                }
            }
        });
    }, 60000);
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
        execCmd('insertHTML', `<img src="${state.selectedImage}" alt="${escapeHtml(altText)}" loading="lazy">`);
        closeImageModal();
        toast('Bild eingefügt', 'success');
    } else {
        toast('Bitte ein Bild auswählen', 'error');
    }
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

        toast('Lade Bild hoch...', 'info');

        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64 = e.target.result;
            const filename = `featured-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '-')}`;

            try {
                await github.uploadImage(filename, base64);
                state.featuredImage = `wp-content/uploads/blog/${filename}`;

                const upload = document.getElementById('featuredImageUpload');
                upload.innerHTML = `<img src="${base64}" alt="" loading="lazy">`;
                upload.classList.add('has-image');
                state.hasUnsavedChanges = true;
                toast('Bild hochgeladen', 'success');
            } catch (e) {
                toast('Fehler beim Hochladen', 'error');
            }
        };
        reader.readAsDataURL(file);
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

        if (cmdOrCtrl && e.key === 's') {
            e.preventDefault();
            saveDraft();
        }

        if (e.key === 'Escape') {
            closePreview();
            closeImageModal();
            document.getElementById('queuePanel').classList.remove('open');
        }
    });

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
