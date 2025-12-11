/* blog-editor-publish.js
 * Veröffentlichung & Queue Management
 * Zeilen: ~290 | Verantwortung: Publish, Schedule, Queue
 * Abhängigkeiten: blog-editor-config.js, blog-editor-github.js
 */

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

    if (typeof window.SharedUI !== 'undefined') {
        const categories = state.currentPost.categories?.length
            ? state.currentPost.categories.join(', ')
            : 'Keine Kategorien';
        const hasImage = state.currentPost.featuredImage ? '✅ Vorhanden' : '❌ Fehlt';

        const details = `
            <div class="publish-preview">
                <div class="preview-row"><strong>Titel:</strong> ${escapeHtml(state.currentPost.title)}</div>
                <div class="preview-row"><strong>Kategorien:</strong> ${categories}</div>
                <div class="preview-row"><strong>Beitragsbild:</strong> ${hasImage}</div>
                <div class="preview-row"><strong>URL:</strong> /${state.currentPost.slug || generateSlug(state.currentPost.title)}.html</div>
            </div>
        `;

        const confirmed = await window.SharedUI.confirm.show({
            title: '📤 Beitrag veröffentlichen?',
            message: 'Überprüfe die Details vor dem Veröffentlichen:',
            details: details,
            confirmText: 'Veröffentlichen',
            cancelText: 'Abbrechen',
            type: 'publish'
        });

        if (!confirmed) return;
    }

    await doPublishPost();
}

async function doPublishPost() {
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

        if (typeof window.SharedUI !== 'undefined') {
            window.SharedUI.errorRecovery.show({
                message: 'Veröffentlichung fehlgeschlagen',
                details: e.message,
                onRetry: () => doPublishPost()
            });
        } else {
            toast('Fehler beim Veröffentlichen: ' + e.message, 'error');
        }
    }
}

// ============================================
// SCHEDULING
// ============================================

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

    state.queue = state.queue.filter(q => q.id !== state.currentPost.id);
    addToQueue({ ...state.currentPost, queueStatus: 'scheduled' });

    renderPostList();
    showTab('scheduled');
    toast(`Geplant für ${formatDateTime(scheduledDateTime)}`, 'success');
}

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

// ============================================
// HTML GENERATION
// ============================================

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
    <link rel="canonical" href="https://coaching.kathrinstahl.com/${post.slug}.html" />
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
    runScheduledCheck();
    setInterval(runScheduledCheck, 30000);
}

function runScheduledCheck() {
    const now = new Date();
    let hasPublished = false;

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
