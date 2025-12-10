/* blog-editor-scheduling.js
 * Integration von Kalender & Scheduling in Blog-Editor | ~150 Zeilen
 */

// Original showTab erweitern
const originalShowTab = typeof showTab === 'function' ? showTab : null;

/**
 * Tab-Wechsel mit Kalender-Support
 */
function showTab(tab) {
    const postList = document.getElementById('postList');
    const calendarPanel = document.getElementById('calendarPanel');
    const searchBox = document.querySelector('.sidebar-search');
    const newPostBtn = document.querySelector('.new-post-btn');

    // Tabs aktualisieren
    document.querySelectorAll('.sidebar-tab').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
    });

    const activeTab = document.querySelector(`.sidebar-tab[onclick*="${tab}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
        activeTab.setAttribute('aria-selected', 'true');
    }

    // State aktualisieren
    if (typeof state !== 'undefined') {
        state.selectedTab = tab;
        state.currentTab = tab;
    }

    // Kalender-Tab Spezialbehandlung
    if (tab === 'scheduled') {
        postList.style.display = 'none';
        calendarPanel.style.display = 'block';
        if (searchBox) searchBox.style.display = 'none';
        if (newPostBtn) newPostBtn.style.display = 'none';

        // Kalender initialisieren falls noch nicht geschehen
        if (typeof ContentCalendar !== 'undefined' && !ContentCalendar.container) {
            ContentCalendar.init('contentCalendar');
        } else if (typeof ContentCalendar !== 'undefined') {
            ContentCalendar.refresh();
        }
    } else {
        postList.style.display = 'block';
        calendarPanel.style.display = 'none';
        if (searchBox) searchBox.style.display = 'flex';
        if (newPostBtn) newPostBtn.style.display = 'flex';

        // Original-Logik für drafts/published
        if (typeof renderPostList === 'function') {
            renderPostList();
        }
    }
}

/**
 * Schedule Modal für aktuellen Post öffnen
 */
function openScheduleModal() {
    // Aktuellen Post aus Editor holen
    const title = document.getElementById('postTitle')?.value || 'Unbenannter Beitrag';
    const content = typeof getEditorContent === 'function' ? getEditorContent() : '';

    const post = {
        title: title,
        slug: typeof generateSlug === 'function' ? generateSlug(title) : title.toLowerCase().replace(/\s+/g, '-'),
        content: {
            blocks: typeof state !== 'undefined' && state.currentPost?.blocks
                ? state.currentPost.blocks
                : [{ type: 'text', content: content }]
        },
        excerpt: content.substring(0, 160).replace(/<[^>]*>/g, ''),
        categories: typeof state !== 'undefined' ? state.selectedCategories : [],
        featuredImage: typeof state !== 'undefined' ? state.featuredImage : null
    };

    if (typeof SchedulingModal !== 'undefined') {
        SchedulingModal.open(post);
    } else {
        console.error('SchedulingModal nicht geladen');
        if (typeof showToast === 'function') {
            showToast('Scheduling nicht verfügbar', 'error');
        }
    }
}

/**
 * Scheduled Post in Editor laden
 */
async function loadScheduledPost(postId) {
    try {
        if (typeof showLoading === 'function') showLoading(true);

        const post = await SchedulerAPI.getPost(postId);

        if (!post) {
            throw new Error('Post nicht gefunden');
        }

        // In Editor laden
        const titleInput = document.getElementById('postTitle');
        if (titleInput) titleInput.value = post.title;

        // Content parsen
        const content = typeof post.content === 'string'
            ? JSON.parse(post.content)
            : post.content;

        // Blocks laden
        if (content.blocks && typeof loadBlocks === 'function') {
            loadBlocks(content.blocks);
        } else if (typeof setEditorContent === 'function') {
            setEditorContent(content);
        }

        // State aktualisieren
        if (typeof state !== 'undefined') {
            state.currentPost = {
                ...post,
                content: content,
                blocks: content.blocks || []
            };
            state.selectedCategories = post.categories || [];
            state.featuredImage = post.featured_image;
        }

        // Kategorien UI aktualisieren
        if (typeof updateCategoryUI === 'function') {
            updateCategoryUI();
        }

        // Zur Editor-Ansicht wechseln
        showTab('drafts');

        if (typeof showToast === 'function') {
            showToast('Beitrag geladen', 'success');
        }

    } catch (error) {
        console.error('Fehler beim Laden:', error);
        if (typeof showToast === 'function') {
            showToast('Fehler beim Laden des Beitrags', 'error');
        }
    } finally {
        if (typeof showLoading === 'function') showLoading(false);
    }
}

/**
 * Publish-Button erweitern mit Schedule-Option
 */
function extendPublishButton() {
    const publishBtn = document.querySelector('.btn-success[onclick*="publishPost"]');
    if (!publishBtn) return;

    // Dropdown hinzufügen
    const wrapper = document.createElement('div');
    wrapper.className = 'publish-dropdown';
    wrapper.innerHTML = `
        <button class="btn btn-success" onclick="publishPost()">Veröffentlichen</button>
        <button class="btn btn-success publish-dropdown-toggle" onclick="togglePublishDropdown(event)">▼</button>
        <div class="publish-dropdown-menu" style="display: none;">
            <button onclick="openScheduleModal()">📅 Planen...</button>
            <button onclick="publishPost()">🚀 Jetzt veröffentlichen</button>
        </div>
    `;

    publishBtn.parentNode.replaceChild(wrapper, publishBtn);
}

function togglePublishDropdown(event) {
    event.stopPropagation();
    const menu = event.target.nextElementSibling;
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';

    // Click außerhalb schließt Menu
    document.addEventListener('click', () => {
        menu.style.display = 'none';
    }, { once: true });
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    // Publish-Button erweitern (optional, kann auskommentiert werden)
    // extendPublishButton();
});

console.log('✓ blog-editor-scheduling.js geladen');
